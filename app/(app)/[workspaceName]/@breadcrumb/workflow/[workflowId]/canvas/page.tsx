import { WorkflowTrail } from '../../../_components/workflow-trail';

import type { Id } from '@/convex/_generated/dataModel';

type CanvasBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string; workflowId: Id<'workflows'> }>;
};

export default async function CanvasBreadcrumbPage({
  params,
}: CanvasBreadcrumbPageProps) {
  const { workspaceName, workflowId } = await params;
  return <WorkflowTrail workspaceName={workspaceName} workflowId={workflowId} />;
}
