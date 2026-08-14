import { ConvexError, Infer, v } from 'convex/values';

import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from './_generated/server';
import { workflowCanvasValidator } from './canvas';
import {
  getMemberWorkspaceByName,
  requireMember,
  requireUserId,
} from './workspaces';

import type { Id } from './_generated/dataModel';
import type { QueryCtx } from './_generated/server';

const scheduleValidator = v.object({
  _id: v.id('workflowSchedules'),
  _creationTime: v.number(),
  workflowId: v.id('workflows'),
  cron: v.string(),
  timezone: v.string(),
  enabled: v.boolean(),
  nextRunAt: v.optional(v.number()),
  lastRunAt: v.optional(v.number()),
  createdBy: v.id('users'),
});

export type WorkflowSchedule = Infer<typeof scheduleValidator>;

/** Resolves the caller-visible workflow for a member, or null. */
async function memberWorkflow(
  ctx: QueryCtx,
  workspaceName: string,
  workflowId: Id<'workflows'>
) {
  const workspace = await getMemberWorkspaceByName(ctx, workspaceName);
  if (workspace === null) {
    return null;
  }
  const workflow = await ctx.db.get(workflowId);
  if (workflow === null || workflow.workspaceId !== workspace._id) {
    return null;
  }
  return workflow;
}

/** The schedule for a workflow, if one exists and the caller may see it. */
export const getForWorkflow = query({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.union(v.null(), scheduleValidator),
  handler: async (ctx, args) => {
    const workflow = await memberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    if (workflow === null) {
      return null;
    }
    return await ctx.db
      .query('workflowSchedules')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
  },
});

/** Member-check for the `set` action, returning the caller's id to record as
 * the schedule's owner. Throws if the caller can't run this workflow. */
export const assertMemberForSchedule = internalQuery({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.id('users'),
  handler: async (ctx, args) => {
    const workflow = await memberWorkflow(
      ctx,
      args.workspaceName,
      args.workflowId
    );
    if (workflow === null) {
      throw new ConvexError('Workflow not found.');
    }
    return await requireUserId(ctx);
  },
});

/** Creates or updates a workflow's schedule. Called by the `set` action once it
 * has validated the cron and computed `nextRunAt`. */
export const upsert = internalMutation({
  args: {
    workflowId: v.id('workflows'),
    cron: v.string(),
    timezone: v.string(),
    enabled: v.boolean(),
    nextRunAt: v.optional(v.number()),
    createdBy: v.id('users'),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('workflowSchedules')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing === null) {
      await ctx.db.insert('workflowSchedules', {
        workflowId: args.workflowId,
        cron: args.cron,
        timezone: args.timezone,
        enabled: args.enabled,
        nextRunAt: args.nextRunAt,
        createdBy: args.createdBy,
      });
    } else {
      await ctx.db.patch(existing._id, {
        cron: args.cron,
        timezone: args.timezone,
        enabled: args.enabled,
        nextRunAt: args.nextRunAt,
      });
    }
    return null;
  },
});

/** Removes a workflow's schedule entirely. */
export const remove = mutation({
  args: { workspaceName: v.string(), workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      throw new ConvexError('Workspace not found.');
    }
    await requireMember(ctx, workspace._id);
    const existing = await ctx.db
      .query('workflowSchedules')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

/** Deletes a workflow's schedule when the workflow itself is deleted. */
export const deleteForWorkflow = internalMutation({
  args: { workflowId: v.id('workflows') },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query('workflowSchedules')
      .withIndex('workflow', (q) => q.eq('workflowId', args.workflowId))
      .unique();
    if (existing !== null) {
      await ctx.db.delete(existing._id);
    }
    return null;
  },
});

/** Enabled schedules that are due to run (nextRunAt at or before `now`), which
 * the dispatcher cron fires. */
export const listDue = internalQuery({
  args: { now: v.number() },
  returns: v.array(scheduleValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query('workflowSchedules')
      .withIndex('due', (q) =>
        q.eq('enabled', true).lte('nextRunAt', args.now)
      )
      .take(100);
  },
});

/** A scheduled workflow's current canvas, for the dispatcher to snapshot and
 * run. Null if the workflow was deleted out from under the schedule. */
export const workflowForSchedule = internalQuery({
  args: { workflowId: v.id('workflows') },
  returns: v.union(v.null(), v.object({ canvas: workflowCanvasValidator })),
  handler: async (ctx, args) => {
    const workflow = await ctx.db.get(args.workflowId);
    if (workflow === null) {
      return null;
    }
    return { canvas: workflow.canvas };
  },
});

/** Advances a schedule after a fire: records when it last ran and the freshly
 * computed next fire time. */
export const markRan = internalMutation({
  args: {
    scheduleId: v.id('workflowSchedules'),
    ranAt: v.number(),
    nextRunAt: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const schedule = await ctx.db.get(args.scheduleId);
    if (schedule === null) {
      return null;
    }
    await ctx.db.patch(args.scheduleId, {
      lastRunAt: args.ranAt,
      nextRunAt: args.nextRunAt,
      // A schedule whose cron can no longer be parsed disables itself.
      enabled: args.nextRunAt !== undefined,
    });
    return null;
  },
});
