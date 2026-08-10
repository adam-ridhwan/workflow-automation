import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { preloadQuery } from 'convex/nextjs';

import { FilesView } from './_components/files-view';

type FilesPageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function FilesPage({ params }: FilesPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  const [preloadedFiles, preloadedFolders] = await Promise.all([
    preloadQuery(
      api.files.list,
      { workspaceName: decodedWorkspaceName },
      { token }
    ),
    preloadQuery(
      api.folders.list,
      { workspaceName: decodedWorkspaceName, kind: 'file' },
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
