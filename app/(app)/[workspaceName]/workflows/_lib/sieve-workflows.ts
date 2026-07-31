import type { Workflow } from '@/convex/queries/workflows';

export type WorkflowsSearchParams = {
  state?: 'published' | 'unpublished';
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
};

export function sieveWorkflows(
  workflows: Workflow[],
  searchParams: WorkflowsSearchParams
) {
  const { state, sort, order, q } = searchParams;
  let result = workflows;

  if (state === 'published' || state === 'unpublished') {
    const wantPublished = state === 'published';
    result = result.filter(
      (workflow) => workflow.isPublished === wantPublished
    );
  }

  if (q) {
    const needle = q.toLowerCase();
    result = result.filter(
      (workflow) =>
        workflow.name.toLowerCase().includes(needle) ||
        (workflow.description?.toLowerCase().includes(needle) ?? false)
    );
  }

  // Sort ascending, then flip when the effective order is descending.
  switch (sort) {
    case 'name':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;

    case 'status':
      result = [...result].sort(
        (a, b) => Number(a.isPublished) - Number(b.isPublished)
      );
      break;

    default:
      result = [...result].sort((a, b) => a._creationTime - b._creationTime);
  }

  // Descending unless explicitly ascending.
  if (order !== 'asc') {
    result.reverse();
  }

  return result;
}
