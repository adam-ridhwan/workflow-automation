'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

type WorkflowStatusBadgeProps = {
  isPublished: boolean;
  isOwner: boolean;
};

/** Publish-status control in the workflow header. Owners get a switch to
 * publish or unpublish; everyone else sees a read-only badge. State comes from
 * the header's shared query. */
export function WorkflowStatusBadge({
  isPublished,
  isOwner,
}: WorkflowStatusBadgeProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const setPublished = useMutation(api.workflows.setPublished);

  const colorClassName = isPublished
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : 'bg-muted text-muted-foreground';

  // Only the owner may change the published state (also guarded in the backend).
  if (!isOwner) {
    return (
      <Badge
        variant='secondary'
        className={cn('gap-1.5 rounded-full', colorClassName)}
      >
        <span className='size-1.25 rounded-full bg-current' />
        {isPublished ? 'Published' : 'Unpublished'}
      </Badge>
    );
  }

  async function handleSelect(nextPublished: boolean) {
    if (nextPublished === isPublished) {
      return;
    }
    try {
      await setPublished({
        workspaceName,
        workflowId,
        isPublished: nextPublished,
      });
      toast.add({
        type: 'success',
        title: nextPublished ? 'Workflow published.' : 'Workflow unpublished.',
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
      className='border-input flex cursor-pointer items-center gap-2 rounded-lg
        border px-2.5 py-1 text-sm select-none'
    >
      <Switch
        size='sm'
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
