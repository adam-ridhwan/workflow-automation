import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { preloadQuery } from 'convex/nextjs';

import { FilesView } from './_components/files-view';

import type { Id } from '@/convex/_generated/dataModel';

type FilesPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function FilesPage({ params }: FilesPageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  const [preloadedFiles, preloadedFolders] = await Promise.all([
    preloadQuery(api.files.list, { workspaceId: workspaceId }, { token }),
    preloadQuery(
      api.folders.list,
      { workspaceId: workspaceId, kind: 'file' },
      { token }
    ),
  ]);

  return (
    <FilesView
      preloadedFiles={preloadedFiles}
      preloadedFolders={preloadedFolders}
      isRoot
    />
  );
}
