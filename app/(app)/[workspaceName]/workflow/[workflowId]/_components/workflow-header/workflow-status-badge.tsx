'use client';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ChevronDownIcon } from 'lucide-react';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

type WorkflowStatusBadgeProps = {
  isPublished: boolean;
  isOwner: boolean;
};

/** Publish-status pill in the workflow header. Owners get a dropdown to publish
 * or unpublish; everyone else sees a read-only badge. State comes from the
 * header's shared query. */
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
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Badge
            variant='secondary'
            render={<button type='button' />}
            aria-label='Publish status'
            className={cn(
              'cursor-pointer gap-1.5 rounded-full',
              colorClassName,
              isPublished
                ? 'hover:bg-emerald-500/25'
                : 'hover:bg-muted-foreground/15'
            )}
          />
        }
      >
        <span className='size-1.25 rounded-full bg-current' />
        {isPublished ? 'Published' : 'Unpublished'}
        <ChevronDownIcon className='size-3 opacity-60' />
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' className='w-36'>
        <DropdownMenuRadioGroup
          value={isPublished ? 'published' : 'unpublished'}
          onValueChange={(value) => {
            handleSelect(value === 'published');
          }}
        >
          <DropdownMenuRadioItem value='published'>
            Published
          </DropdownMenuRadioItem>
          <DropdownMenuRadioItem value='unpublished'>
            Unpublished
          </DropdownMenuRadioItem>
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
