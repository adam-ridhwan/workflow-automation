import { slugify } from '@/lib/slugify';
import {
  validateWorkspaceName,
  WORKSPACE_NAME_REQUIREMENTS,
} from '@/lib/validate-workspace-name';
import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from '../_generated/server';

import type { Doc, Id } from '../_generated/dataModel';
import type { MutationCtx, QueryCtx } from '../_generated/server';

const workspaceValidator = v.object({
  _id: v.id('workspaces'),
  createdAt: v.number(),
  name: v.string(),
  adminId: v.id('users'),
});

export type Workspace = Infer<typeof workspaceValidator>;

function toWorkspace(doc: Doc<'workspaces'>): Workspace {
  const { _creationTime, ...fields } = doc;
  return { ...fields, createdAt: _creationTime };
}

async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError('You must be signed in.');
  }
  return userId;
}

function getMembership(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>,
  userId: Id<'users'>
) {
  return ctx.db
    .query('workspaceMembers')
    .withIndex('workspaceUser', (q) =>
      q.eq('workspaceId', workspaceId).eq('userId', userId)
    )
    .unique();
}

/** Throws unless the signed-in user is a member of the workspace. */
export async function requireMember(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>
) {
  const userId = await requireUserId(ctx);
  const membership = await getMembership(ctx, workspaceId, userId);
  if (membership === null) {
    throw new ConvexError('You are not a member of this workspace.');
  }
  return membership;
}

/** Throws unless the signed-in user is the admin of the workspace. */
export async function requireAdmin(
  ctx: QueryCtx | MutationCtx,
  workspaceId: Id<'workspaces'>
) {
  const membership = await requireMember(ctx, workspaceId);
  if (membership.role !== 'admin') {
    throw new ConvexError('Only the workspace admin can do this.');
  }
  return membership;
}

export const create = mutation({
  args: { name: v.string() },
  returns: v.id('workspaces'),
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const name = slugify(args.name);
    if (!validateWorkspaceName(name)) {
      throw new ConvexError(WORKSPACE_NAME_REQUIREMENTS);
    }
    const existing = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', name))
      .unique();
    if (existing !== null) {
      throw new ConvexError('This workspace name is taken.');
    }
    const workspaceId = await ctx.db.insert('workspaces', {
      name,
      adminId: userId,
    });
    await ctx.db.insert('workspaceMembers', {
      workspaceId,
      userId,
      role: 'admin',
    });
    return workspaceId;
  },
});

export const getByName = query({
  args: { name: v.string() },
  returns: v.union(v.null(), workspaceValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return null;
    }
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', args.name))
      .unique();
    if (workspace === null) {
      return null;
    }
    const membership = await getMembership(ctx, workspace._id, userId);
    if (membership === null) {
      return null;
    }
    return toWorkspace(workspace);
  },
});

export const list = query({
  args: {},
  returns: v.array(workspaceValidator),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('userId', (q) => q.eq('userId', userId))
      .collect();
    const workspaces = await Promise.all(
      memberships.map((membership) => ctx.db.get(membership.workspaceId))
    );
    return workspaces
      .filter((workspace) => workspace !== null)
      .map(toWorkspace);
  },
});

const memberValidator = v.object({
  userId: v.id('users'),
  name: v.string(),
  email: v.string(),
  role: v.union(v.literal('admin'), v.literal('collaborator')),
});

export type WorkspaceMember = Infer<typeof memberValidator>;

export const members = query({
  args: { workspaceName: v.string() },
  returns: v.array(memberValidator),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (userId === null) {
      return [];
    }
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', args.workspaceName))
      .unique();
    if (workspace === null) {
      return [];
    }
    const membership = await getMembership(ctx, workspace._id, userId);
    if (membership === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workspaceMembers')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    const result: WorkspaceMember[] = [];
    for (const row of rows) {
      const user = await ctx.db.get(row.userId);
      if (user !== null) {
        result.push({
          userId: row.userId,
          name: user.name,
          email: user.email,
          role: row.role,
        });
      }
    }
    return result;
  },
});

export const addMember = mutation({
  args: { workspaceName: v.string(), email: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', args.workspaceName))
      .unique();
    if (workspace === null) {
      throw new ConvexError('Workspace not found.');
    }
    await requireAdmin(ctx, workspace._id);

    const email = args.email.trim();
    const user = await ctx.db
      .query('users')
      .withIndex('email', (q) => q.eq('email', email))
      .unique();
    if (user === null) {
      throw new ConvexError('No account found with this email.');
    }

    const existing = await getMembership(ctx, workspace._id, user._id);
    if (existing !== null) {
      throw new ConvexError('This user is already a member.');
    }

    await ctx.db.insert('workspaceMembers', {
      workspaceId: workspace._id,
      userId: user._id,
      role: 'collaborator',
    });
    return null;
  },
});
