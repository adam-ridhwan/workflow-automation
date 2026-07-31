import { getAuthUserId } from '@convex-dev/auth/server';
import { ConvexError, Infer, v } from 'convex/values';

import { mutation, query } from './_generated/server';
import { getWorkspaceByNameOrThrow, requireMember } from './workspaces';

import type { Id } from './_generated/dataModel';
import type { MutationCtx, QueryCtx } from './_generated/server';

const workflowValidator = v.object({
  _id: v.id('workflows'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  description: v.optional(v.string()),
  isPublished: v.boolean(),
  createdBy: v.id('users'),
  createdByName: v.string(),
});

export type Workflow = Infer<typeof workflowValidator>;

async function getMemberWorkspaceByName(ctx: QueryCtx, workspaceName: string) {
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
  const membership = await ctx.db
    .query('workspaceMembers')
    .withIndex('workspaceUser', (q) =>
      q.eq('workspaceId', workspace._id).eq('userId', userId)
    )
    .unique();
  if (membership === null) {
    return null;
  }
  return workspace;
}

async function getMemberWorkflow(
  ctx: MutationCtx,
  workspaceName: string,
  workflowId: Id<'workflows'>
) {
  const workspace = await getWorkspaceByNameOrThrow(ctx, workspaceName);
  await requireMember(ctx, workspace._id);

  const workflow = await ctx.db.get(workflowId);
  if (workflow === null || workflow.workspaceId !== workspace._id) {
    throw new ConvexError('Workflow not found.');
  }
  return workflow;
}

export const get = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return null;
    }
    const creator = await ctx.db.get(workflow.createdBy);
    return { ...workflow, createdByName: creator?.name ?? 'Unknown' };
  },
});

export const list = query({
  args: { workspaceName: v.string() },
  returns: v.array(workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    const nameCache = new Map<Id<'users'>, string>();
    const result: Workflow[] = [];
    for (const row of rows) {
      let createdByName = nameCache.get(row.createdBy);
      if (createdByName === undefined) {
        const user = await ctx.db.get(row.createdBy);
        createdByName = user?.name ?? 'Unknown';
        nameCache.set(row.createdBy, createdByName);
      }
      result.push({ ...row, createdByName });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Workflow name is required.');
    }
    // .first() rather than .unique(): duplicates that predate this
    // constraint may still exist in the table.
    const existing = await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspace._id).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A workflow with this name already exists in this workspace.'
      );
    }
    const description = args.description?.trim();

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: description ? description : undefined,
      isPublished: false,
      createdBy: membership.userId,
    });
  },
});

export const rename = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    name: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );

    const name = args.name.trim();
    if (name.length === 0) {
      throw new ConvexError('Workflow name is required.');
    }
    if (name === workflow.name) {
      return null;
    }
    const existing = await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workflow.workspaceId).eq('name', name)
      )
      .first();
    if (existing !== null) {
      throw new ConvexError(
        'A workflow with this name already exists in this workspace.'
      );
    }
    await ctx.db.patch(workflow._id, { name });
    return null;
  },
});

export const remove = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    await ctx.db.delete(workflow._id);
    return null;
  },
});
