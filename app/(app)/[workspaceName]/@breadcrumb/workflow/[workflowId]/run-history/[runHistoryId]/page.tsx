import { WorkflowTrail } from '../../../../_components/workflow-trail';

import type { Id } from '@/convex/_generated/dataModel';

type RunHistoryDetailBreadcrumbPageProps = {
  params: Promise<{
    workspaceName: string;
    workflowId: Id<'workflows'>;
    runHistoryId: Id<'runHistory'>;
  }>;
};

export default async function RunHistoryDetailBreadcrumbPage({
  params,
}: RunHistoryDetailBreadcrumbPageProps) {
  const { workspaceName, workflowId } = await params;
  return <WorkflowTrail workspaceName={workspaceName} workflowId={workflowId} />;
}
