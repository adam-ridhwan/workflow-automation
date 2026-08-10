import { WorkflowTrail } from '../../_components/workflow-trail';

import type { Id } from '@/convex/_generated/dataModel';

type WorkflowBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string; workflowId: Id<'workflows'> }>;
};

export default async function WorkflowBreadcrumbPage({
  params,
}: WorkflowBreadcrumbPageProps) {
  const { workspaceName, workflowId } = await params;
  return (
    <WorkflowTrail workspaceName={workspaceName} workflowId={workflowId} />
  );
}
