import { ConvexError, Infer, v } from 'convex/values';

import { internal } from './_generated/api';
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import { getMemberWorkspaceByName } from './workspaces';

/** Per-node status. */
export const nodeStatusValidator = v.union(
  v.literal('running'),
  v.literal('success'),
  v.literal('error')
);
export type NodeStatus = Infer<typeof nodeStatusValidator>;

/** Overall run status (adds `stopped` for user-cancelled runs). */
export const runStatusValidator = v.union(
  v.literal('running'),
  v.literal('success'),
  v.literal('error'),
  v.literal('stopped')
);
export type RunStatus = Infer<typeof runStatusValidator>;

const runHistoryValidator = v.object({
  _id: v.id('runHistory'),
  _creationTime: v.number(),
  workflowId: v.id('workflows'),
  canvas: workflowCanvasValidator,
  status: runStatusValidator,
  stopRequested: v.optional(v.boolean()),
  nodeStatuses: v.optional(v.record(v.string(), nodeStatusValidator)),
  nodeOutputs: v.record(v.string(), v.string()),
  error: v.optional(v.string()),
  startedAt: v.number(),
  finishedAt: v.optional(v.number()),
});

export type RunHistory = Infer<typeof runHistoryValidator>;

/** A workflow's runs, newest first. */
export const list = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.array(runHistoryValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return [];
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return [];
    }
    return await ctx.db
      .query('runHistory')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .order('desc')
      .take(50);
  },
});

/** A single run by id, member-checked. */
export const get = query({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    runHistoryId: v.id('runHistory'),
  },
  returns: v.union(v.null(), runHistoryValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const run = await ctx.db.get(args.runHistoryId);
    if (run === null || run.workflowId !== args.workflowId) {
      return null;
    }
    const workflow = await ctx.db.get(run.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      return null;
    }
    return run;
  },
});

/** Snapshots the canvas at the start of a run; returns the new run's id. */
export const create = internalMutation({
  args: { workflowId: v.id('workflows'), canvas: workflowCanvasValidator },
  returns: v.id('runHistory'),
  handler: async (ctx, args) => {
    return await ctx.db.insert('runHistory', {
      workflowId: args.workflowId,
      canvas: args.canvas,
      status: 'running',
      nodeOutputs: {},
      startedAt: Date.now(),
    });
  },
});

/** Re-runs a previous run's snapshot in the background, returning the new run
 * id immediately so the client can navigate to it. The snapshot's node ids
 * are reused as-is (they already differ from the live canvas), so no id
 * remapping — which needs randomness — is required here in a mutation. */
export const startRerun = mutation({
  args: {
    workspaceName: v.string(),
    workflowId: v.id('workflows'),
    fromRunHistoryId: v.id('runHistory'),
  },
  returns: v.id('runHistory'),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      throw new ConvexError('Workspace not found.');
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      throw new ConvexError('Workflow not found.');
    }
    const source = await ctx.db.get(args.fromRunHistoryId);
    if (source === null || source.workflowId !== args.workflowId) {
      throw new ConvexError('Run not found.');
    }

    const runHistoryId = await ctx.db.insert('runHistory', {
      workflowId: args.workflowId,
      canvas: source.canvas,
      status: 'running',
      nodeOutputs: {},
      startedAt: Date.now(),
    });
    await ctx.scheduler.runAfter(0, internal.runWorkflow.execute, {
      workflowId: args.workflowId,
      runHistoryId,
      canvas: source.canvas,
    });
    return runHistoryId;
  },
});

/** Requests that the workflow's latest running run stop. The executor checks
 * this between nodes. */
export const stopRun = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      throw new ConvexError('Workspace not found.');
    }
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null || workflow.workspaceId !== workspace._id) {
      throw new ConvexError('Workflow not found.');
    }
    // The newest run is the one currently executing, if any.
    const latest = await ctx.db
      .query('runHistory')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .order('desc')
      .first();
    if (latest !== null && latest.status === 'running') {
      await ctx.db.patch(latest._id, { stopRequested: true });
    }
    return null;
  },
});

/** Whether a stop has been requested for a run (checked mid-execution). */
export const isStopRequested = internalQuery({
  args: { runHistoryId: v.id('runHistory') },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runHistoryId);
    return run?.stopRequested ?? false;
  },
});

/** Updates one node's status on the history record as the run progresses. */
export const setNodeStatus = internalMutation({
  args: {
    runHistoryId: v.id('runHistory'),
    nodeId: v.string(),
    status: nodeStatusValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const run = await ctx.db.get(args.runHistoryId);
    if (run === null) {
      return null;
    }
    await ctx.db.patch(args.runHistoryId, {
      nodeStatuses: { ...run.nodeStatuses, [args.nodeId]: args.status },
    });
    return null;
  },
});

/** Records the final outcome of a run. */
export const finish = internalMutation({
  args: {
    runHistoryId: v.id('runHistory'),
    status: runStatusValidator,
    nodeOutputs: v.record(v.string(), v.string()),
    error: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.patch(args.runHistoryId, {
      status: args.status,
      nodeOutputs: args.nodeOutputs,
      error: args.error,
      finishedAt: Date.now(),
    });
    return null;
  },
});
