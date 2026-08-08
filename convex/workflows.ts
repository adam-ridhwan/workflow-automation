import { ConvexError, Infer, v } from 'convex/values';

import { WORKFLOW_TEMPLATES } from '../lib/workflow-templates';
import { internalMutation, mutation, query } from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import {
  getMemberWorkspaceByName,
  getWorkspaceByNameOrThrow,
  requireMember,
  requireUserId,
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
  ownerEmail: v.string(),
  /** Whether the requesting user owns this workflow — only they may publish it
   * or see it while unpublished. */
  isOwner: v.boolean(),
  canvas: workflowCanvasValidator,
  runCount: v.number(),
  successCount: v.number(),
  failCount: v.number(),
  lastRunAt: v.optional(v.number()),
  lastRunStatus: v.optional(
    v.union(v.literal('success'), v.literal('error'), v.literal('stopped'))
  ),
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

/** A workflow name in the workspace that isn't taken: `base`, then "base 2",
 * "base 3", … . Used when the name is generated rather than user-supplied. */
async function nextAvailableWorkflowName(
  ctx: MutationCtx,
  workspaceId: Id<'workspaces'>,
  base: string
) {
  let name = base;
  let suffix = 2;
  while (
    (await ctx.db
      .query('workflows')
      .withIndex('workspaceName', (q) =>
        q.eq('workspaceId', workspaceId).eq('name', name)
      )
      .first()) !== null
  ) {
    name = `${base} ${suffix}`;
    suffix += 1;
  }
  return name;
}

export const get = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), workflowValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const userId = await requireUserId(ctx);
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return null;
    }
    const owner = await ctx.db.get(workflow.ownerId);
    return {
      ...workflow,
      ownerName: owner?.name ?? 'Unknown',
      ownerEmail: owner?.email ?? '',
      isOwner: workflow.ownerId === userId,
    };
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
    const userId = await requireUserId(ctx);
    const rows = await ctx.db
      .query('workflows')
      .withIndex('folder', (q) =>
        q.eq('workspaceId', workspace._id).eq('folderId', args.folderId)
      )
      .collect();
    const ownerCache = new Map<Id<'users'>, { name: string; email: string }>();
    const result: Workflow[] = [];
    for (const row of rows) {
      // Unpublished workflows are visible only to their owner.
      if (!row.isPublished && row.ownerId !== userId) {
        continue;
      }
      let owner = ownerCache.get(row.ownerId);
      if (owner === undefined) {
        const user = await ctx.db.get(row.ownerId);
        owner = { name: user?.name ?? 'Unknown', email: user?.email ?? '' };
        ownerCache.set(row.ownerId, owner);
      }
      result.push({
        ...row,
        ownerName: owner.name,
        ownerEmail: owner.email,
        isOwner: row.ownerId === userId,
      });
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
        nodes: {},
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

/** Publish or unpublish a workflow. */
export const setPublished = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    isPublished: v.boolean(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await getMemberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    const userId = await requireUserId(ctx);
    if (workflow.ownerId !== userId) {
      throw new ConvexError(
        'Only the workflow owner can change its published status.'
      );
    }

    if (workflow.isPublished === args.isPublished) {
      return null;
    }
    await ctx.db.patch(workflow._id, {
      isPublished: args.isPublished,
      updatedAt: Date.now(),
    });
    return null;
  },
});

/** Copies a workflow (and its canvas) into a new unpublished workflow owned by
 * the current member, with a non-colliding "<name> copy" name. Returns the new
 * workflow id. */
export const duplicate = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
  },
  returns: v.id('workflows'),
  handler: async (ctx, args) => {
    const workspace = await getWorkspaceByNameOrThrow(ctx, args.workspaceName);
    const membership = await requireMember(ctx, workspace._id);

    const source = await ctx.db.get(args.workflowId);
    if (source === null || source.workspaceId !== workspace._id) {
      throw new ConvexError('Workflow not found.');
    }

    const name = await nextAvailableWorkflowName(
      ctx,
      workspace._id,
      `${source.name} copy`
    );

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: source.description,
      isPublished: false,
      folderId: source.folderId,
      ownerId: membership.userId,
      canvas: source.canvas,
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
    });
  },
});

/** Creates a new unpublished workflow from a built-in template. Returns the
 * new workflow id. */
export const createFromTemplate = mutation({
  args: {
    workspaceName: v.string(),
    templateId: v.string(),
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

    const template = WORKFLOW_TEMPLATES.find(
      (candidate) => candidate.id === args.templateId
    );
    if (template === undefined) {
      throw new ConvexError('Template not found.');
    }

    const name = await nextAvailableWorkflowName(
      ctx,
      workspace._id,
      template.name
    );

    return await ctx.db.insert('workflows', {
      workspaceId: workspace._id,
      name,
      description: template.description,
      isPublished: false,
      folderId: args.folderId,
      ownerId: membership.userId,
      canvas: template.canvas,
      runCount: 0,
      successCount: 0,
      failCount: 0,
      updatedAt: Date.now(),
    });
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

/** Records a finished backend run: bumps the counters and stamps when/how the
 * workflow last ran. A stopped run counts as a run but not a failure. Does not
 * touch `updatedAt` — that tracks edits, not runs. */
export const recordRun = internalMutation({
  args: {
    workflowId: v.id('workflows'),
    status: v.union(
      v.literal('success'),
      v.literal('error'),
      v.literal('stopped')
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null) {
      return null;
    }
    await ctx.db.patch(args.workflowId, {
      runCount: workflow.runCount + 1,
      successCount: workflow.successCount + (args.status === 'success' ? 1 : 0),
      failCount: workflow.failCount + (args.status === 'error' ? 1 : 0),
      lastRunAt: Date.now(),
      lastRunStatus: args.status,
    });
    return null;
  },
});
