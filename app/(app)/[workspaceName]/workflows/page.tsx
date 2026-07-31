import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { WorkflowsEmpty } from './_components/workflows-empty';
import { WorkflowsHeader } from './_components/workflows-header';
import { WorkflowsTable } from './_components/workflows-table';
import { sieveWorkflows } from './_lib/sieve-workflows';

import type { WorkflowsSearchParams } from './_lib/sieve-workflows';

type WorkflowsPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<WorkflowsSearchParams>;
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
    api.workflows.list,
    { workspaceName: decodedWorkspaceName },
    { token }
  );

  if (workflows.length === 0) {
    return <WorkflowsEmpty workspaceName={decodedWorkspaceName} />;
  }

  const sievedWorkflows = sieveWorkflows(workflows, { state, sort, order, q });
  const isFiltered = Boolean(state || q);

  return (
    <>
      <WorkflowsHeader />
      <WorkflowsTable
        workflows={sievedWorkflows}
        workspaceName={decodedWorkspaceName}
        isFiltered={isFiltered}
      />
    </>
  );
}
