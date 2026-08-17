import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { sieveFolders } from '../_lib/sieve-resources';
import { WorkflowsEmpty } from './_components/workflows-empty';
import { WorkflowsTable } from './_components/workflows-table';
import { sieveWorkflows } from './_lib/sieve-workflows';

import type { WorkflowsSearchParams } from './_lib/sieve-workflows';

import type { Id } from '@/convex/_generated/dataModel';
type WorkflowsPageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<WorkflowsSearchParams>;
};

export default async function WorkflowsPage({
  params,
  searchParams,
}: WorkflowsPageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const [workflows, folders] = await Promise.all([
    fetchQuery(
      api.workflows.list,
      { workspaceId: workspaceId },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      { workspaceId: workspaceId, kind: 'workflow' },
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
