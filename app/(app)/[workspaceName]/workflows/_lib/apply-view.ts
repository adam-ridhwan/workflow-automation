import { defaultOrder } from './sort';

import type { Workflow } from '@/convex/queries/workflows';

export type WorkflowsView = {
  state?: 'published' | 'unpublished';
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
};

export function applyView(workflows: Workflow[], view: WorkflowsView) {
  const { state, sort, order, q } = view;
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

  const effectiveOrder =
    order === 'asc' || order === 'desc'
      ? order
      : defaultOrder(sort ?? 'recent');
  if (effectiveOrder === 'desc') {
    result.reverse();
  }

  return result;
}
