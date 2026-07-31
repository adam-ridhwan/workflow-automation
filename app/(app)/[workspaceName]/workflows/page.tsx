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
  const [workflows, folders] = await Promise.all([
    fetchQuery(
      api.workflows.list,
      { workspaceName: decodedWorkspaceName },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      { workspaceName: decodedWorkspaceName },
      { token }
    ),
  ]);

  if (workflows.length === 0 && folders.length === 0) {
    return <WorkflowsEmpty workspaceName={decodedWorkspaceName} />;
  }

  const sievedWorkflows = sieveWorkflows(workflows, { state, sort, order, q });
  // Folders have no publish state; hide them when filtering by state, and
  // match the search against their names.
  const needle = q?.toLowerCase();
  const sievedFolders = state
    ? []
    : folders
        .filter(
          (folder) => !needle || folder.name.toLowerCase().includes(needle)
        )
        .sort((a, b) => a.name.localeCompare(b.name));
  const isFiltered = Boolean(state || q);

  return (
    <>
      <WorkflowsHeader />
      <WorkflowsTable
        workflows={sievedWorkflows}
        folders={sievedFolders}
        workspaceName={decodedWorkspaceName}
        isFiltered={isFiltered}
      />
    </>
  );
}
