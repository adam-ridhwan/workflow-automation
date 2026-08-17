'use node';

import { CronExpressionParser } from 'cron-parser';
import { ConvexError, v } from 'convex/values';

import { internal } from './_generated/api';
import { action, internalAction } from './_generated/server';

/** The next fire time (epoch ms) of a cron in a timezone, strictly after
 * `fromMs`. Throws if the cron or timezone is invalid. */
function computeNextRunAt(
  cron: string,
  timezone: string,
  fromMs: number
): number {
  const interval = CronExpressionParser.parse(cron, {
    tz: timezone,
    currentDate: new Date(fromMs),
  });
  return interval.next().toDate().getTime();
}

/** Creates or updates a workflow's schedule. Validates the cron (rejecting a
 * bad expression with a clean message) and computes the first `nextRunAt` when
 * enabling. Returns the next fire time, or null when disabled. */
export const set = action({
  args: {
    workspaceId: v.id('workspaces'),
    workflowId: v.id('workflows'),
    cron: v.string(),
    timezone: v.string(),
    enabled: v.boolean(),
  },
  returns: v.union(v.null(), v.number()),
  handler: async (ctx, args): Promise<number | null> => {
    const createdBy = await ctx.runQuery(
      internal.schedules.assertMemberForSchedule,
      { workspaceId: args.workspaceId, workflowId: args.workflowId }
    );

    // Always validate the cron so even a disabled schedule stays coherent.
    let nextRunAt: number | undefined;
    try {
      const next = computeNextRunAt(args.cron, args.timezone, Date.now());
      nextRunAt = args.enabled ? next : undefined;
    } catch {
      throw new ConvexError('That schedule is invalid.');
    }

    await ctx.runMutation(internal.schedules.upsert, {
      workflowId: args.workflowId,
      cron: args.cron,
      timezone: args.timezone,
      enabled: args.enabled,
      nextRunAt,
      createdBy,
    });
    return nextRunAt ?? null;
  },
});

/** Runs every minute (see convex/crons.ts): fires every enabled schedule whose
 * `nextRunAt` has passed, recording a run-history entry (attributed to the
 * schedule's creator) for each, then advances each to its next fire time. */
export const dispatch = internalAction({
  args: {},
  returns: v.null(),
  handler: async (ctx) => {
    const now = Date.now();
    const due = await ctx.runQuery(internal.schedules.listDue, { now });

    for (const schedule of due) {
      // Enabled rows always carry a nextRunAt; skip any that don't rather than
      // fire prematurely.
      if (schedule.nextRunAt === undefined) {
        continue;
      }

      const workflow = await ctx.runQuery(
        internal.schedules.workflowForSchedule,
        { workflowId: schedule.workflowId }
      );
      // The workflow was deleted out from under the schedule — drop it.
      if (workflow === null) {
        await ctx.runMutation(internal.schedules.deleteForWorkflow, {
          workflowId: schedule.workflowId,
        });
        continue;
      }

      // Only run published workflows; an unpublished one still advances below so
      // its schedule doesn't fire every minute. Runs are recorded to history
      // (attributed to the schedule's creator) so they're reviewable like
      // manual ones; the snapshot reuses the workflow's node ids.
      if (workflow.isPublished) {
        const runHistoryId = await ctx.runMutation(internal.runHistory.create, {
          workflowId: schedule.workflowId,
          canvas: workflow.canvas,
          ranBy: schedule.createdBy,
          trigger: 'schedule',
        });
        await ctx.scheduler.runAfter(0, internal.runWorkflow.execute, {
          workflowId: schedule.workflowId,
          runHistoryId,
          canvas: workflow.canvas,
        });
      }

      // Advance to the next fire time. A cron that no longer parses disables the
      // schedule (markRan clears `enabled` when nextRunAt is undefined).
      let nextRunAt: number | undefined;
      try {
        nextRunAt = computeNextRunAt(schedule.cron, schedule.timezone, now);
      } catch {
        nextRunAt = undefined;
      }
      await ctx.runMutation(internal.schedules.markRan, {
        scheduleId: schedule._id,
        ranAt: now,
        nextRunAt,
      });
    }
    return null;
  },
});
