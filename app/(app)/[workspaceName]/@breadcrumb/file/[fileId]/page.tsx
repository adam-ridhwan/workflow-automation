import { FileTrail } from '../../_components/file-trail';

import type { Id } from '@/convex/_generated/dataModel';

type FileBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string; fileId: Id<'files'> }>;
};

export default async function FileBreadcrumbPage({
  params,
}: FileBreadcrumbPageProps) {
  const { workspaceName, fileId } = await params;
  return <FileTrail workspaceName={workspaceName} fileId={fileId} />;
}
