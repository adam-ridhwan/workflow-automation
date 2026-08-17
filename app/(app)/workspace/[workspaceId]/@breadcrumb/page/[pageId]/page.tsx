import { PageTrail } from '../../_components/page-trail';

import type { Id } from '@/convex/_generated/dataModel';

type PageBreadcrumbProps = {
  params: Promise<{ workspaceId: string; pageId: Id<'pages'> }>;
};

export default async function PageBreadcrumb({ params }: PageBreadcrumbProps) {
  const { workspaceId: workspaceIdParam, pageId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return <PageTrail workspaceId={workspaceId} pageId={pageId} />;
}
