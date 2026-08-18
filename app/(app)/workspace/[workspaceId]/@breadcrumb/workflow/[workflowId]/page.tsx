import { WorkflowTrail } from '../../_components/workflow-trail';

import type { Id } from '@/convex/_generated/dataModel';

type WorkflowBreadcrumbPageProps = {
  params: Promise<{ workspaceId: string; workflowId: Id<'workflows'> }>;
};

export default async function WorkflowBreadcrumbPage({
  params,
}: WorkflowBreadcrumbPageProps) {
  const { workspaceId: workspaceIdParam, workflowId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return <WorkflowTrail workspaceId={workspaceId} workflowId={workflowId} />;
}
