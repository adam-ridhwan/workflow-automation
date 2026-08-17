'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { WorkflowChainMenu } from '../../workflow/[workflowId]/_components/workflow-header/workflow-chain-menu';
import { WorkflowMoreMenu } from '../../workflow/[workflowId]/_components/workflow-header/workflow-more-menu';
import { WorkflowScheduleMenu } from '../../workflow/[workflowId]/_components/workflow-header/workflow-schedule-menu';
import { WorkflowStatusBadge } from '../../workflow/[workflowId]/_components/workflow-header/workflow-status-badge';
import { WorkflowVersionsMenu } from '../../workflow/[workflowId]/_components/workflow-header/workflow-versions-menu';

/** The current workflow's live toggle, version history, and more-menu, rendered
 * into the site header via the `@headerActions` parallel-route slot (left of the
 * collaborators menu). Subscribes once for what the controls need. */
export function WorkflowHeaderActionsSlot() {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const workflow = useQuery(api.workflows.get, { workspaceId, workflowId });
  if (!workflow) {
    return null;
  }
  return (
    <>
      <WorkflowStatusBadge isPublished={workflow.isPublished} />
      <WorkflowVersionsMenu />
      <WorkflowScheduleMenu />
      <WorkflowChainMenu chainWorkflowIds={workflow.chainWorkflowIds ?? []} />
      <WorkflowMoreMenu name={workflow.name} />
    </>
  );
}
