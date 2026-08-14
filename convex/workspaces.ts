import { slugify } from '@/lib/slugify';
import {
  validateWorkspaceName,
  WORKSPACE_NAME_REQUIREMENTS,
} from '@/lib/validate-workspace-name';
import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { internal } from './_generated/api';
import { internalMutation, mutation, query } from './_generated/server';
import { resolveUserImageUrl } from './users';

import type { Doc, Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

const workspaceValidator = v.object({
  _id: v.id('workspaces'),
  _creationTime: v.number(),
  name: v.string(),
  adminId: v.id('users'),
  imageId: v.optional(v.id('_storage')),
  imageUrl: v.union(v.null(), v.string()),
});

export type Workspace = Infer<typeof workspaceValidator>;

const memberValidator = v.object({
  userId: v.id('users'),
  name: v.string(),
  email: v.string(),
  imageUrl: v.union(v.null(), v.string()),
  role: v.union(v.literal('admin'), v.literal('collaborator')),
});

export type WorkspaceMember = Infer<typeof memberValidator>;

async function withImageUrl(
  ctx: QueryCtx | MutationCtx,
  doc: Doc<'workspaces'>
): Promise<Workspace> {
  return {
    ...doc,
    imageUrl: doc.imageId ? await ctx.storage.getUrl(doc.imageId) : null,
  };
}

export async function requireUserId(ctx: QueryCtx | MutationCtx) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    throw new ConvexError('You must be signed in.');
  }
  return userId;
}

export function getMembership(
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

/** Resolves a workspace by name; null unless the signed-in user is a
 * member. */
export async function getMemberWorkspaceByName(
  ctx: QueryCtx | MutationCtx,
  workspaceName: string
) {
  const userId = await getAuthUserId(ctx);
  if (userId === null) {
    return null;
  }
  const workspace = await ctx.db
    .query('workspaces')
    .withIndex('name', (q) => q.eq('name', workspaceName))
    .unique();
  if (workspace === null) {
    return null;
  }
  const membership = await getMembership(ctx, workspace._id, userId);
  if (membership === null) {
    return null;
  }
  return workspace;
}

export async function getWorkspaceByNameOrThrow(
  ctx: QueryCtx | MutationCtx,
  workspaceName: string
) {
  const workspace = await ctx.db
    .query('workspaces')
    .withIndex('name', (q) => q.eq('name', workspaceName))
    .unique();
  if (workspace === null) {
    throw new ConvexError('Workspace not found.');
  }
  return workspace;
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
    return await withImageUrl(ctx, workspace);
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
    return await Promise.all(
      workspaces
        .filter((workspace) => workspace !== null)
        .map((workspace) => withImageUrl(ctx, workspace))
    );
  },
});

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
          imageUrl: await resolveUserImageUrl(ctx, user),
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
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
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

export const rename = mutation({
  args: { workspaceName: v.string(), name: v.string() },
  returns: v.string(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    await requireAdmin(ctx, workspace._id);

    const name = slugify(args.name);
    if (!validateWorkspaceName(name)) {
      throw new ConvexError(WORKSPACE_NAME_REQUIREMENTS);
    }
    if (name === workspace.name) {
      return name;
    }
    const existing = await ctx.db
      .query('workspaces')
      .withIndex('name', (q) => q.eq('name', name))
      .unique();
    if (existing !== null) {
      throw new ConvexError('This workspace name is taken.');
    }
    await ctx.db.patch(workspace._id, { name });
    return name;
  },
});

export const generateLogoUploadUrl = mutation({
  args: {},
  returns: v.string(),
  handler: async (ctx) => {
    await requireUserId(ctx);
    return await ctx.storage.generateUploadUrl();
  },
});

export const setLogo = mutation({
  args: { workspaceName: v.string(), storageId: v.id('_storage') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    await requireAdmin(ctx, workspace._id);

    if (workspace.imageId) {
      await ctx.storage.delete(workspace.imageId);
    }
    await ctx.db.patch(workspace._id, { imageId: args.storageId });
    return null;
  },
});

export const remove = mutation({
  args: { workspaceName: v.string() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    await requireAdmin(ctx, workspace._id);

    // Remove memberships and the workspace doc now so it disappears from every
    // member's list immediately; everything else is purged in the background.
    const memberships = await ctx.db
      .query('workspaceMembers')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    if (workspace.imageId) {
      await ctx.storage.delete(workspace.imageId);
    }
    await ctx.db.delete(workspace._id);

    // Workflows (and their run history / versions / runs / schedules), files
    // (and their storage blobs), folders, and secrets can be numerous, so purge
    // them in batches rather than risk exceeding a single mutation's limits.
    await ctx.scheduler.runAfter(0, internal.workspaces.purgeWorkspaceData, {
      workspaceId: workspace._id,
    });
    return null;
  },
});

/** Deletes everything belonging to a deleted workspace, one bounded batch at a
 * time, rescheduling itself until nothing remains. Ordered so a workflow's
 * dependent rows are removed before the workflow itself. */
export const purgeWorkspaceData = internalMutation({
  args: { workspaceId: v.id('workspaces') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const BATCH = 100;
    const reschedule = () =>
      ctx.scheduler.runAfter(0, internal.workspaces.purgeWorkspaceData, {
        workspaceId: args.workspaceId,
      });

    // 1. Workflows and their dependent rows, one workflow at a time. The
    // workflow doc is deleted only once its large child tables are drained.
    const workflow = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .first();
    if (workflow !== null) {
      const history = await ctx.db
        .query('runHistory')
        .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
        .take(BATCH);
      for (const row of history) {
        await ctx.db.delete(row._id);
      }
      const versions = await ctx.db
        .query('workflowVersions')
        .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
        .take(BATCH);
      for (const version of versions) {
        await ctx.db.delete(version._id);
      }
      if (history.length < BATCH && versions.length < BATCH) {
        const run = await ctx.db
          .query('runs')
          .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
          .unique();
        if (run !== null) {
          await ctx.db.delete(run._id);
        }
        const schedule = await ctx.db
          .query('workflowSchedules')
          .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
          .unique();
        if (schedule !== null) {
          await ctx.db.delete(schedule._id);
        }
        await ctx.db.delete(workflow._id);
      }
      await reschedule();
      return null;
    }

    // 2. Files, along with their storage blobs (assembled file + any chunks).
    const files = await ctx.db
      .query('files')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .take(BATCH);
    if (files.length > 0) {
      for (const file of files) {
        if (file.storageId) {
          await ctx.storage.delete(file.storageId);
        }
        for (const chunk of file.chunks ?? []) {
          await ctx.storage.delete(chunk);
        }
        await ctx.db.delete(file._id);
      }
      await reschedule();
      return null;
    }

    // 3. Folders.
    const folders = await ctx.db
      .query('folders')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .take(BATCH);
    if (folders.length > 0) {
      for (const folder of folders) {
        await ctx.db.delete(folder._id);
      }
      await reschedule();
      return null;
    }

    // 4. Secrets.
    const secrets = await ctx.db
      .query('workspaceSecrets')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .take(BATCH);
    if (secrets.length > 0) {
      for (const secret of secrets) {
        await ctx.db.delete(secret._id);
      }
      await reschedule();
      return null;
    }

    // 5. Any memberships not already removed (defensive).
    const members = await ctx.db
      .query('workspaceMembers')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', args.workspaceId))
      .take(BATCH);
    if (members.length > 0) {
      for (const member of members) {
        await ctx.db.delete(member._id);
      }
      await reschedule();
      return null;
    }

    // Nothing left — done.
    return null;
  },
});
