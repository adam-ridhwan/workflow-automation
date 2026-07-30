import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { WorkflowsHeader } from './_components/workflows-header';
import { WorkflowsTable } from './_components/workflows-table';

import type { Workflow } from '@/convex/queries/workflows';

type WorkflowsPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<{ state?: string; sort?: string; q?: string }>;
};

function applyFilters(
  workflows: Workflow[],
  { state, sort, q }: { state?: string; sort?: string; q?: string }
) {
  let result = workflows;

  if (state === 'live' || state === 'canvas') {
    const wantPublished = state === 'live';
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

  switch (sort) {
    case 'name':
      result = [...result].sort((a, b) => a.name.localeCompare(b.name));
      break;
    case 'status':
      result = [...result].sort(
        (a, b) => Number(b.isPublished) - Number(a.isPublished)
      );
      break;
    default:
      result = [...result].sort((a, b) => b._creationTime - a._creationTime);
  }

  return result;
}

export default async function WorkflowsPage({
  params,
  searchParams,
}: WorkflowsPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const { state, sort, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const workflows = await fetchQuery(
    api.queries.workflows.list,
    { workspaceName: decodedWorkspaceName },
    { token }
  );

  const filtered = applyFilters(workflows, { state, sort, q });
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
