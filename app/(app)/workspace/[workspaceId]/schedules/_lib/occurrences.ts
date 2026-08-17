import { CronExpressionParser } from 'cron-parser';

import type { Id } from '@/convex/_generated/dataModel';
import type { WorkflowScheduleWithWorkflow } from '@/convex/schedules';

export type Occurrence = {
  at: Date;
  workflowId: Id<'workflows'>;
  workflowName: string;
  cron: string;
  timezone: string;
};

/** All scheduled-run times within [monthStart, monthEnd], from each enabled
 * schedule's cron (evaluated in its own timezone). */
export function computeOccurrences(
  schedules: WorkflowScheduleWithWorkflow[],
  monthStart: Date,
  monthEnd: Date
): Occurrence[] {
  const out: Occurrence[] = [];
  for (const schedule of schedules) {
    if (!schedule.enabled) {
      continue;
    }
    try {
      const expr = CronExpressionParser.parse(schedule.cron, {
        tz: schedule.timezone,
        currentDate: monthStart,
        endDate: monthEnd,
      });
      let guard = 0;
      while (guard < 2000) {
        guard += 1;
        let at: Date;
        try {
          at = expr.next().toDate();
        } catch {
          break;
        }
        if (at.getTime() > monthEnd.getTime()) {
          break;
        }
        out.push({
          at,
          workflowId: schedule.workflowId,
          workflowName: schedule.workflowName,
          cron: schedule.cron,
          timezone: schedule.timezone,
        });
      }
    } catch {
      // Unparseable cron — skip it.
    }
  }
  return out;
}

export function formatTimeOfDay(date: Date): string {
  return date.toLocaleTimeString(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  });
}
