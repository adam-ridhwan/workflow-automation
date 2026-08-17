import { Infer, v } from 'convex/values';

import { internalMutation, query } from './_generated/server';
import { getMemberWorkspaceById } from './workspaces';

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
  phase: v.optional(v.union(v.literal('scheduled'), v.literal('running'))),
  nodeStatuses: v.record(v.string(), nodeStatusValidator),
  nodeOutputs: v.record(v.string(), v.string()),
});

/** The latest run of a workflow; live-updates while a run executes. */
export const get = query({
  args: { workspaceId: v.id('workspaces'), workflowId: v.id('workflows') },
  returns: v.union(v.null(), runValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
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

/** Resets the workflow's run doc at the start of a run and marks it 'running'
 * for the whole run — so the run button reflects one stable state rather than
 * flickering as per-node statuses come and go. */
export const start = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        nodeStatuses: {},
        nodeOutputs: {},
        phase: 'running',
      });
    } else {
      await ctx.db.insert('runs', {
        workflowId: args.workflowId,
        phase: 'running',
        nodeStatuses: {},
        nodeOutputs: {},
      });
    }
    return null;
  },
});

/** Clears the run's phase back to idle the moment it finishes, so the run
 * button frees immediately while the per-node badges linger (cleared a beat
 * later by `clearStatuses`). */
export const markFinished = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('runs')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, { phase: undefined });
    }
    return null;
  },
});

/** Marks workflows as queued to run (as later steps of a chain). Skips ids
 * whose workflow no longer exists so no orphan run docs are created. */
export const markScheduled = internalMutation({
  args: { workflowIds: v.array(v.id('workflows')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const workflowId of args.workflowIds) {
      if ((await ctx.db.get(workflowId)) === null) {
        continue;
      }
      const existing = await ctx.db
        .query('runs')
        .withIndex('workflow', (q) => q.eq('workflowId', workflowId))
        .unique();
      if (existing) {
        await ctx.db.patch(existing._id, { phase: 'scheduled' });
      } else {
        await ctx.db.insert('runs', {
          workflowId,
          phase: 'scheduled',
          nodeStatuses: {},
          nodeOutputs: {},
        });
      }
    }
    return null;
  },
});

/** Clears the 'scheduled' phase on workflows that are still queued — used when a
 * chain won't run after all (its parent failed) or as a final safety net. Only
 * touches still-queued workflows, never one that has since started running. */
export const clearScheduled = internalMutation({
  args: { workflowIds: v.array(v.id('workflows')) },
  returns: v.null(),
  handler: async (ctx, args) => {
    for (const workflowId of args.workflowIds) {
      const existing = await ctx.db
        .query('runs')
        .withIndex('workflow', (q) => q.eq('workflowId', workflowId))
        .unique();
      if (existing && existing.phase === 'scheduled') {
        await ctx.db.patch(existing._id, { phase: undefined });
      }
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

/** The live run phase of every currently-active workflow in the workspace,
 * keyed by workflow id. Powers the run/stop controls in the workflows table:
 * one subscription that updates as any workflow starts, queues, or finishes.
 * Workflows with no active run are omitted. */
export const phasesByWorkspace = query({
  args: { workspaceId: v.id('workspaces') },
  returns: v.record(
    v.string(),
    v.union(v.literal('scheduled'), v.literal('running'))
  ),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceById(ctx, args.workspaceId);
    if (workspace === null) {
      return {};
    }
    const workflows = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    const phases: Record<string, 'scheduled' | 'running'> = {};
    for (const workflow of workflows) {
      const run = await ctx.db
        .query('runs')
        .withIndex('workflow', (q) => q.eq('workflowId', workflow._id))
        .unique();
      if (run?.phase !== undefined) {
        phases[workflow._id] = run.phase;
      }
    }
    return phases;
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
