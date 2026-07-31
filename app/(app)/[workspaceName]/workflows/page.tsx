import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { WorkflowsEmpty } from './_components/workflows-empty';
import { WorkflowsHeader } from './_components/workflows-header';
import { WorkflowsTable } from './_components/workflows-table';
import { applyView } from './_lib/apply-view';

type WorkflowsPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<{
    state?: 'published' | 'unpublished';
    sort?: string;
    order?: 'asc' | 'desc';
    q?: string;
  }>;
};

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

  const filtered = applyView(workflows, { state, sort, order, q });
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
