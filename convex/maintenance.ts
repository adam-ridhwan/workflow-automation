import { v } from 'convex/values';

import { internal } from './_generated/api';
import { internalMutation } from './_generated/server';

/**
 * One-off cleanup for orphaned rows left behind before delete-cascades existed:
 * child rows whose parent workflow or workspace no longer exists. Run it with:
 *   npx convex run maintenance:cleanupOrphans
 * It processes one page of one table per call and reschedules itself until every
 * table has been swept, so it never exceeds a single mutation's limits.
 *
 * Phases are ordered so orphaned workflows are removed first — that way their
 * now-orphaned child rows are caught by the later phases in the same sweep.
 */
const PHASE_COUNT = 9;

export const cleanupOrphans = internalMutation({
  args: {
    phase: v.optional(v.number()),
    cursor: v.optional(v.union(v.string(), v.null())),
    removed: v.optional(v.number()),
    /** When true, count orphans without deleting anything. */
    dryRun: v.optional(v.boolean()),
  },
  returns: v.object({ finished: v.boolean(), removedSoFar: v.number() }),
  handler: async (ctx, args) => {
    const phase = args.phase ?? 0;
    const cursor = args.cursor ?? null;
    let removed = args.removed ?? 0;
    const dryRun = args.dryRun ?? false;
    const NUM = 200;

    // True when the parent document no longer exists.
    const gone = async (id: Parameters<typeof ctx.db.get>[0]) =>
      (await ctx.db.get(id)) === null;

    let isDone = true;
    let continueCursor: string | null = null;

    switch (phase) {
      // 0. Workflows whose workspace is gone. Removed first so their children
      // become detectable orphans in the later workflow-child phases.
      case 0: {
        const result = await ctx.db
          .query('workflows')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workspaceId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }

      // 1–4. Workflow child rows whose workflow is gone.
      case 1: {
        const result = await ctx.db
          .query('runHistory')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workflowId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
      case 2: {
        const result = await ctx.db
          .query('workflowVersions')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workflowId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
      case 3: {
        const result = await ctx.db
          .query('runs')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workflowId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
      case 4: {
        const result = await ctx.db
          .query('workflowSchedules')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workflowId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }

      // 5. Files whose workspace is gone — also drop their storage blobs.
      case 5: {
        const result = await ctx.db
          .query('files')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workspaceId)) {
            if (!dryRun) {
              if (row.storageId) {
                await ctx.storage.delete(row.storageId);
              }
              for (const chunk of row.chunks ?? []) {
                await ctx.storage.delete(chunk);
              }
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }

      // 6–8. Other workspace child rows whose workspace is gone.
      case 6: {
        const result = await ctx.db
          .query('folders')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workspaceId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
      case 7: {
        const result = await ctx.db
          .query('workspaceSecrets')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workspaceId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
      default: {
        const result = await ctx.db
          .query('workspaceMembers')
          .paginate({ cursor, numItems: NUM });
        for (const row of result.page) {
          if (await gone(row.workspaceId)) {
            if (!dryRun) {
              await ctx.db.delete(row._id);
            }
            removed += 1;
          }
        }
        isDone = result.isDone;
        continueCursor = result.continueCursor;
        break;
      }
    }

    if (!isDone) {
      // More of this table to scan.
      await ctx.scheduler.runAfter(0, internal.maintenance.cleanupOrphans, {
        phase,
        cursor: continueCursor,
        removed,
        dryRun,
      });
      return { finished: false, removedSoFar: removed };
    }

    if (phase + 1 < PHASE_COUNT) {
      // On to the next table.
      await ctx.scheduler.runAfter(0, internal.maintenance.cleanupOrphans, {
        phase: phase + 1,
        cursor: null,
        removed,
        dryRun,
      });
      return { finished: false, removedSoFar: removed };
    }

    // All tables swept.
    console.log(
      dryRun
        ? `Orphan cleanup (dry run): found ${removed} orphaned rows.`
        : `Orphan cleanup finished: removed ${removed} rows.`
    );
    return { finished: true, removedSoFar: removed };
  },
});
