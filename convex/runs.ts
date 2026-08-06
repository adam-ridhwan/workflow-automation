import { Infer, v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { getMemberWorkspaceByName } from './workspaces';

export const nodeStatusValidator = v.union(
  v.literal('running'),
  v.literal('success'),
  v.literal('error')
);
export type NodeStatus = Infer<typeof nodeStatusValidator>;

const runValidator = v.object({
  _id: v.id('runs'),
  _creationTime: v.number(),
  workflowId: v.id('workflows'),
  nodeStatuses: v.record(v.string(), nodeStatusValidator),
  nodeOutputs: v.record(v.string(), v.string()),
});

/** The latest run of a workflow; live-updates while a run executes. */
export const get = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), runValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return null;
    }
    return await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
  },
});

/** Resets the workflow's run doc at the start of a run. */
export const start = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { nodeStatuses: {}, nodeOutputs: {} });
    } else {
      await ctx.db.insert('runs', {
        workflowId: args.workflowId,
        nodeStatuses: {},
        nodeOutputs: {},
      });
    }
    return null;
  },
});

/** Updates one node's status (and output, once finished) mid-run. */
export const setNodeStatus = internalMutation({
  args: {
    workflowId: v.id('workflows'),
    nodeId: v.string(),
    status: nodeStatusValidator,
    output: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (run === null) {
      return null;
    }
    await ctx.db.patch(run._id, {
      nodeStatuses: { ...run.nodeStatuses, [args.nodeId]: args.status },
      ...(args.output !== undefined && {
        nodeOutputs: { ...run.nodeOutputs, [args.nodeId]: args.output },
      }),
    });
    return null;
  },
});

/** Clears the per-node statuses (keeps outputs); scheduled a moment after a
 * successful run so the badges fade away. */
export const clearStatuses = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (run !== null) {
      await ctx.db.patch(run._id, { nodeStatuses: {} });
    }
    return null;
  },
});
