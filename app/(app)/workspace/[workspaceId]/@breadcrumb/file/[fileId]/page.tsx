import { FileTrail } from '../../_components/file-trail';

import type { Id } from '@/convex/_generated/dataModel';

type FileBreadcrumbPageProps = {
  params: Promise<{ workspaceId: string; fileId: Id<'files'> }>;
};

export default async function FileBreadcrumbPage({
  params,
}: FileBreadcrumbPageProps) {
  const { workspaceId: workspaceIdParam, fileId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return <FileTrail workspaceId={workspaceId} fileId={fileId} />;
}
