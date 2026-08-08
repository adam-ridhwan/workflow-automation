'use client';

import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { RunWorkflowButton } from './run-workflow-button';
import { SaveIndicator } from './save-indicator';
import { UndoRedoButtons } from './undo-redo-buttons';
import { WorkflowMoreMenu } from './workflow-more-menu';
import { WorkflowStatusBadge } from './workflow-status-badge';

/** The header's right-side action group. Subscribes to the workflow once and
 * hands it to the controls that need it, so the status badge and more-menu
 * don't each open their own subscription. */
export function WorkflowHeaderActions() {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const workflow = useQuery(api.workflows.get, { workspaceName, workflowId });
  const isLoading = workflow === undefined;

  if (isLoading) {
    return <Skeleton className='h-5 w-100' />;
  }

  if (!workflow) {
    return null;
  }

  return (
    <div className='flex items-center gap-2'>
      <SaveIndicator />
      <WorkflowStatusBadge
        isPublished={workflow.isPublished}
        isOwner={workflow.isOwner}
      />
      <UndoRedoButtons />
      <RunWorkflowButton />
      <WorkflowMoreMenu name={workflow?.name ?? ''} />
    </div>
  );
}
