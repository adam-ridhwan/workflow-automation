import { Infer, v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import { getMemberWorkspaceByName } from './workspaces';

export const runStatusValidator = v.union(
  v.literal('running'),
  v.literal('success'),
  v.literal('error')
);
export type RunStatus = Infer<typeof runStatusValidator>;

const runHistoryValidator = v.object({
  _id: v.id('runHistory'),
  _creationTime: v.number(),
  workflowId: v.id('workflows'),
  canvas: workflowCanvasValidator,
  status: runStatusValidator,
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
