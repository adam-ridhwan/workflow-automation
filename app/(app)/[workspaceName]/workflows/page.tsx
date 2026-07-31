import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { WorkflowsEmpty } from './_components/workflows-empty';
import { WorkflowsHeader } from './_components/workflows-header';
import { WorkflowsTable } from './_components/workflows-table';
import { defaultOrder } from './_lib/sort';

import type { Workflow } from '@/convex/queries/workflows';

type WorkflowsPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<{
    state?: 'published' | 'unpublished';
    sort?: string;
    order?: string;
    q?: string;
  }>;
};

function applyFilters(
  workflows: Workflow[],
  {
    state,
    sort,
    order,
    q,
  }: { state?: string; sort?: string; order?: string; q?: string }
) {
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

  // Sort ascending, then flip when the effective direction is descending.
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

export default async function WorkflowsPage({
  params,
  searchParams,
}: WorkflowsPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const workflows = await fetchQuery(
    api.queries.workflows.list,
    { workspaceName: decodedWorkspaceName },
    { token }
  );

  if (workflows.length === 0) {
    return <WorkflowsEmpty workspaceName={decodedWorkspaceName} />;
  }

  const filtered = applyFilters(workflows, { state, sort, order, q });
  const isFiltered = Boolean(state || q);

  return (
    <>
      <WorkflowsHeader />
      <WorkflowsTable
        workflows={filtered}
        workspaceName={decodedWorkspaceName}
        isFiltered={isFiltered}
      />
    </>
  );
}
