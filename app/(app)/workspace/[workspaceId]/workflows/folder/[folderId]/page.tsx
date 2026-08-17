import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { WorkflowsTable } from '../../_components/workflows-table';
import { sieveWorkflows } from '../../_lib/sieve-workflows';
import { sieveFolders } from '../../../_lib/sieve-resources';

import type { WorkflowsSearchParams } from '../../_lib/sieve-workflows';
import type { Id } from '@/convex/_generated/dataModel';
import type { Folder } from '@/convex/folders';

type FolderPageProps = {
  params: Promise<{ workspaceId: string; folderId: Id<'folders'> }>;
  searchParams: Promise<WorkflowsSearchParams>;
};

export default async function FolderPage({
  params,
  searchParams,
}: FolderPageProps) {
  const { workspaceId: workspaceIdParam, folderId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  let folder: Folder | null = null;
  try {
    folder = await fetchQuery(
      api.folders.get,
      { workspaceId: workspaceId, folderId },
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
      { workspaceId: workspaceId, folderId: folder._id },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      {
        workspaceId: workspaceId,
        kind: 'workflow',
        parentId: folder._id,
      },
      { token }
    ),
  ]);
  const sievedWorkflows = sieveWorkflows(workflows, { state, sort, order, q });
  const sievedFolders = sieveFolders(subfolders, { state, q });

  return (
    <WorkflowsTable
      workflows={sievedWorkflows}
      folders={sievedFolders}
      isFiltered={Boolean(state || q)}
    />
  );
}
