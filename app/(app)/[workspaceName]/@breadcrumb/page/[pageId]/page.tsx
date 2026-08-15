import { PageTrail } from '../../_components/page-trail';

import type { Id } from '@/convex/_generated/dataModel';

type PageBreadcrumbProps = {
  params: Promise<{ workspaceName: string; pageId: Id<'pages'> }>;
};

export default async function PageBreadcrumb({ params }: PageBreadcrumbProps) {
  const { workspaceName, pageId } = await params;
  return <PageTrail workspaceName={workspaceName} pageId={pageId} />;
}
