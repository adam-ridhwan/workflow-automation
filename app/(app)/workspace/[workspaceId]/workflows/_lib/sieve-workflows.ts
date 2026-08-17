import { sieveResources } from '../../_lib/sieve-resources';

import type { ResourceSearchParams } from '../../_lib/sieve-resources';
import type { Workflow } from '@/convex/workflows';

export type WorkflowsSearchParams = ResourceSearchParams & {
  state?: 'published' | 'unpublished';
};

export function sieveWorkflows(
  workflows: Workflow[],
  searchParams: WorkflowsSearchParams
) {
  return sieveResources(workflows, searchParams, {
    matchesState: (workflow, state) =>
      state === 'published' ? workflow.isPublished : !workflow.isPublished,
    searchFields: (workflow) => [workflow.name, workflow.description],
    comparators: {
      name: (a, b) => a.name.localeCompare(b.name),
      status: (a, b) => Number(a.isPublished) - Number(b.isPublished),
    },
  });
}
