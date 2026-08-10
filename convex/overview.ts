import { v } from 'convex/values';

import { query } from './_generated/server';
import { getMemberWorkspaceByName, requireUserId } from './workspaces';

const overviewValidator = v.object({
  workflows: v.object({
    total: v.number(),
    published: v.number(),
    unpublished: v.number(),
  }),
  runs: v.object({
    total: v.number(),
    success: v.number(),
    failed: v.number(),
    /** Percentage of runs that succeeded, or null when there are no runs. */
    successRate: v.union(v.null(), v.number()),
  }),
  files: v.object({
    total: v.number(),
    indexed: v.number(),
    processing: v.number(),
    failed: v.number(),
  }),
  members: v.number(),
  recentRuns: v.array(
    v.object({
      workflowId: v.id('workflows'),
      workflowName: v.string(),
      status: v.union(
        v.literal('success'),
        v.literal('error'),
        v.literal('stopped')
      ),
      ranAt: v.number(),
    })
  ),
});

const RECENT_RUNS = 6;

/** Aggregate stats for the workspace dashboard: workflow/run/file counts, the
 * success rate, member count, and the latest runs. Null when the signed-in user
 * isn't a member. */
export const get = query({
  args: { workspaceName: v.string() },
  returns: v.union(v.null(), overviewValidator),
  handler: async (ctx, args) => {
    const workspace = await getMemberWorkspaceByName(ctx, args.workspaceName);
    if (workspace === null) {
      return null;
    }
    const userId = await requireUserId(ctx);

    const workflowRows = await ctx.db
      .query('workflows')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    // Match list visibility: unpublished workflows count only for their owner.
    const workflows = workflowRows.filter(
      (workflow) => workflow.isPublished || workflow.ownerId === userId
    );

    let published = 0;
    let totalRuns = 0;
    let success = 0;
    let failed = 0;
    const recent: {
      workflowId: (typeof workflows)[number]['_id'];
      workflowName: string;
      status: 'success' | 'error' | 'stopped';
      ranAt: number;
    }[] = [];
    for (const workflow of workflows) {
      if (workflow.isPublished) {
        published += 1;
      }
      totalRuns += workflow.runCount;
      success += workflow.successCount;
      failed += workflow.failCount;
      if (
        workflow.lastRunAt !== undefined &&
        workflow.lastRunStatus !== undefined
      ) {
        recent.push({
          workflowId: workflow._id,
          workflowName: workflow.name,
          status: workflow.lastRunStatus,
          ranAt: workflow.lastRunAt,
        });
      }
    }
    recent.sort((a, b) => b.ranAt - a.ranAt);

    const files = await ctx.db
      .query('files')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();
    let indexed = 0;
    let filesProcessing = 0;
    let filesFailed = 0;
    for (const file of files) {
      if (file.status === 'indexed') {
        indexed += 1;
      } else if (file.status === 'failed') {
        filesFailed += 1;
      } else {
        // uploading / assembling / processing
        filesProcessing += 1;
      }
    }

    const memberRows = await ctx.db
      .query('workspaceMembers')
      .withIndex('workspaceId', (q) => q.eq('workspaceId', workspace._id))
      .collect();

    return {
      workflows: {
        total: workflows.length,
        published,
        unpublished: workflows.length - published,
      },
      runs: {
        total: totalRuns,
        success,
        failed,
        successRate:
          totalRuns > 0 ? Math.round((success / totalRuns) * 100) : null,
      },
      files: {
        total: files.length,
        indexed,
        processing: filesProcessing,
        failed: filesFailed,
      },
      members: memberRows.length,
      recentRuns: recent.slice(0, RECENT_RUNS),
    };
  },
});
