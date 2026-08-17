import { WorkflowTrail } from '../../../_components/workflow-trail';

import type { Id } from '@/convex/_generated/dataModel';

type RunHistoryBreadcrumbPageProps = {
  params: Promise<{ workspaceId: string; workflowId: Id<'workflows'> }>;
};

export default async function RunHistoryBreadcrumbPage({
  params,
}: RunHistoryBreadcrumbPageProps) {
  const { workspaceId: workspaceIdParam, workflowId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return (
    <WorkflowTrail workspaceId={workspaceId} workflowId={workflowId} />
  );
}
