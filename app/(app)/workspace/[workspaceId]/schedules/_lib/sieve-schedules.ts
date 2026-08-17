import { sieveResources } from '../../_lib/sieve-resources';

import type { ResourceSearchParams } from '../../_lib/sieve-resources';
import type { WorkflowScheduleWithWorkflow } from '@/convex/schedules';

export type SchedulesSearchParams = ResourceSearchParams & {
  state?: 'active' | 'paused';
};

export function sieveSchedules(
  schedules: WorkflowScheduleWithWorkflow[],
  searchParams: SchedulesSearchParams
) {
  return sieveResources(schedules, searchParams, {
    matchesState: (schedule, state) =>
      state === 'active' ? schedule.enabled : !schedule.enabled,
    searchFields: (schedule) => [schedule.workflowName, schedule.cron],
    comparators: {
      name: (a, b) => a.workflowName.localeCompare(b.workflowName),
      next: (a, b) => (a.nextRunAt ?? Infinity) - (b.nextRunAt ?? Infinity),
      status: (a, b) => Number(a.enabled) - Number(b.enabled),
    },
  });
}
