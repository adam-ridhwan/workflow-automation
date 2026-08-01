import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { WorkflowsTable } from '../../_components/workflows-table';
import { sieveWorkflows } from '../../_lib/sieve-workflows';

import type { WorkflowsSearchParams } from '../../_lib/sieve-workflows';
import type { Id } from '@/convex/_generated/dataModel';
import type { Folder } from '@/convex/folders';

type FolderPageProps = {
  params: Promise<{ workspaceName: string; folderId: Id<'folders'> }>;
  searchParams: Promise<WorkflowsSearchParams>;
};

export default async function FolderPage({
  params,
  searchParams,
}: FolderPageProps) {
  const { workspaceName, folderId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  let folder: Folder | null = null;
  try {
    folder = await fetchQuery(
      api.folders.get,
      { workspaceName: decodedWorkspaceName, folderId },
      { token }
    );
  } catch {
    // A malformed id fails argument validation; treat it as not found.
    notFound();
  }
  if (folder === null) {
    notFound();
  }

  const [workflows, subfolders] = await Promise.all([
    fetchQuery(
      api.workflows.list,
      { workspaceName: decodedWorkspaceName, folderId: folder._id },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      { workspaceName: decodedWorkspaceName, parentId: folder._id },
      { token }
    ),
  ]);
  const sievedWorkflows = sieveWorkflows(workflows, { state, sort, order, q });
  // Folders have no publish state; hide them when filtering by state, and
  // match the search against their names.
  const needle = q?.toLowerCase();
  const sievedFolders = state
    ? []
    : subfolders
        .filter(
          (subfolder) =>
            !needle || subfolder.name.toLowerCase().includes(needle)
        )
        .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <WorkflowsTable
      workflows={sievedWorkflows}
      folders={sievedFolders}
      isFiltered={Boolean(state || q)}
    />
  );
}
