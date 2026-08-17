'use client';

import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';

import { useCanWrite } from '../../../../_hooks/use-can-write';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

type WorkflowStatusBadgeProps = {
  isPublished: boolean;
};

/** Publish-status control in the workflow header: a Live switch any workspace
 * member can toggle. State comes from the header's shared query. */
export function WorkflowStatusBadge({ isPublished }: WorkflowStatusBadgeProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const canWrite = useCanWrite();
  const setPublished = useMutation(api.workflows.setPublished);

  async function handleSelect(nextPublished: boolean) {
    if (nextPublished === isPublished) {
      return;
    }
    try {
      await setPublished({
        workspaceId,
        workflowId,
        isPublished: nextPublished,
      });
      toast.add({
        type: 'success',
        title: nextPublished ? 'Workflow is live.' : 'Workflow unpublished.',
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof ConvexError && typeof error.data === 'string'
            ? error.data
            : 'Could not update the workflow. Please try again.',
      });
    }
  }

  return (
    <label
      className={cn(
        'border-input flex items-center gap-2 rounded-lg border px-2.5 py-1',
        'text-sm select-none',
        canWrite ? 'cursor-pointer' : 'cursor-not-allowed'
      )}
      title={canWrite ? undefined : 'Viewers have read-only access.'}
    >
      <Switch
        size='sm'
        disabled={!canWrite}
        checked={isPublished}
        onCheckedChange={(checked) => {
          handleSelect(checked);
        }}
        aria-label='Publish workflow'
      />
      <span
        className={cn(
          'font-medium',
          isPublished
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground'
        )}
      >
        Live
      </span>
    </label>
  );
}
