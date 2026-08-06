import { ConvexError, Infer, v } from 'convex/values';

import { internalMutation, mutation, query } from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import {
  getMemberWorkspaceByName,
  getWorkspaceByNameOrThrow,
  requireMember,
} from './workspaces';

import type { Id } from './_generated/dataModel';
import type { MutationCtx } from './_generated/server';

const workflowValidator = v.object({
  _id: v.id('workflows'),
  _creationTime: v.number(),
  workspaceId: v.id('workspaces'),
  name: v.string(),
  description: v.optional(v.string()),
  isPublished: v.boolean(),
  folderId: v.optional(v.id('folders')),
  ownerId: v.id('users'),
  ownerName: v.string(),
  canvas: workflowCanvasValidator,
  runCount: v.number(),
  successCount: v.number(),
  failCount: v.number(),
  updatedAt: v.number(),
});

export type Workflow = Infer<typeof workflowValidator>;

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
    const owner = await ctx.db.get(workflow.ownerId);
    return { ...workflow, ownerName: owner?.name ?? 'Unknown' };
  },
});

/** Workflows in a folder, or the workspace's root workflows when `folderId`
 * is omitted. */
export const list = query({
  args: {
    workspaceName: v.string(),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.array(workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const rows = await ctx.db
      .query('workflows')
      .withIndex('folder', (q) =>
        q.eq('workspaceId', workspace._id).eq('folderId', args.folderId)
      )
      .collect();
    const nameCache = new Map<Id<'users'>, string>();
    const result: Workflow[] = [];
    for (const row of rows) {
      let ownerName = nameCache.get(row.ownerId);
      if (ownerName === undefined) {
        const user = await ctx.db.get(row.ownerId);
        ownerName = user?.name ?? 'Unknown';
        nameCache.set(row.ownerId, ownerName);
      }
      result.push({ ...row, ownerName });
    }
    return result;
  },
});

export const create = mutation({
  args: {
    workspaceName: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workspace._id) {
        throw new ConvexError('Folder not found.');
      }
    }

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
      folderId: args.folderId,
      ownerId: membership.userId,
      canvas: {
        nodes: {
          start: {
            node_id: 'start',
            node_uid: crypto.randomUUID(),
            name: 'Start',
            arguments: {},
            parents: [],
            children: [],
            position: { x: 0, y: 0 },
          },
        },
        edges: [],
        version: 1,
      },
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
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
    await ctx.db.patch(workflow._id, { name, updatedAt: Date.now() });
    return null;
  },
});

/** Move a workflow into a folder, or to the workspace root when `folderId`
 * is omitted. */
export const move = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    folderId: v.optional(v.id('folders')),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );

    if (args.folderId !== undefined) {
      const folder = await ctx.db.get(args.folderId);
      if (folder === null || folder.workspaceId !== workflow.workspaceId) {
        throw new ConvexError('Destination folder not found.');
      }
    }
    if (workflow.folderId === args.folderId) {
      return null;
    }
    await ctx.db.patch(workflow._id, {
      folderId: args.folderId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Replace a workflow's canvas, e.g. after nodes move or connect. */
export const updateCanvas = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    canvas: workflowCanvasValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    await ctx.db.patch(workflow._id, {
      canvas: args.canvas,
      updatedAt: Date.now(),
    });
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

/** Bumps the run counters after a backend workflow run. */
export const recordRun = internalMutation({
  args: { workflowId: v.id('workflows'), success: v.boolean() },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null) {
      return null;
    }
    await ctx.db.patch(args.workflowId, {
      runCount: workflow.runCount + 1,
      successCount: workflow.successCount + (args.success ? 1 : 0),
      failCount: workflow.failCount + (args.success ? 0 : 1),
      updatedAt: Date.now(),
    });
    return null;
  },
});
