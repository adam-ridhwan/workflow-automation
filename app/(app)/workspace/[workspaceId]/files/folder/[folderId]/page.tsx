import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery, preloadQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { FilesView } from '../../_components/files-view';

import type { Id } from '@/convex/_generated/dataModel';
import type { Folder } from '@/convex/folders';

type FolderPageProps = {
  params: Promise<{ workspaceId: string; folderId: Id<'folders'> }>;
};

export default async function FilesFolderPage({ params }: FolderPageProps) {
  const { workspaceId: workspaceIdParam, folderId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

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
  if (folder === null || folder.kind !== 'file') {
    notFound();
  }

  const [preloadedFiles, preloadedFolders] = await Promise.all([
    preloadQuery(
      api.files.list,
      { workspaceId: workspaceId, folderId: folder._id },
      { token }
    ),
    preloadQuery(
      api.folders.list,
      {
        workspaceId: workspaceId,
        kind: 'file',
        parentId: folder._id,
      },
      { token }
    ),
  ]);

  return (
    <FilesView
      preloadedFiles={preloadedFiles}
      preloadedFolders={preloadedFolders}
      isRoot={false}
    />
  );
}
