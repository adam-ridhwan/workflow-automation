import { FileViewer } from './_components/file-viewer';

import type { Id } from '@/convex/_generated/dataModel';
type FileViewPageProps = {
  params: Promise<{ workspaceId: string; fileId: string }>;
};

export default async function FileViewPage({ params }: FileViewPageProps) {
  const { workspaceId: workspaceIdParam, fileId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return (
    <FileViewer
      workspaceId={workspaceId}
      fileId={fileId}
    />
  );
}
