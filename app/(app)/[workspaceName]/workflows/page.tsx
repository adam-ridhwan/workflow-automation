import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { sieveFolders } from '../_lib/sieve-resources';
import { WorkflowsEmpty } from './_components/workflows-empty';
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
  const [workflows, folders] = await Promise.all([
    fetchQuery(
      api.workflows.list,
      { workspaceName: decodedWorkspaceName },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      { workspaceName: decodedWorkspaceName, kind: 'workflow' },
      { token }
    ),
  ]);

  if (workflows.length === 0 && folders.length === 0) {
    return <WorkflowsEmpty />;
  }

  const sievedWorkflows = sieveWorkflows(workflows, { state, sort, order, q });
  const sievedFolders = sieveFolders(folders, { state, q });
  const isFiltered = Boolean(state || q);

  return (
    <WorkflowsTable
      workflows={sievedWorkflows}
      folders={sievedFolders}
      isFiltered={isFiltered}
    />
  );
}
