'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format-time';
import { getInitials } from '@/lib/get-initials';
import { useDraggable } from '@dnd-kit/core';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { DragData } from '../../_components/workspace-dnd-provider';
import type { Workflow } from '@/convex/workflows';

type WorkflowRowProps = {
  workflow: Workflow;
  onDelete: () => void;
};

export function WorkflowRow({ workflow, onDelete }: WorkflowRowProps) {
  const { workspaceName } = useWorkspaceParams();
  const router = useRouter();
  const renameWorkflow = useMutation(api.workflows.rename);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  function stopRenaming() {
    setIsRenaming(false);
    setRenameError(null);
  }

  async function submitRename(rawName: string) {
    const name = rawName.trim();
    if (name.length === 0 || name === workflow.name) {
      stopRenaming();
      return;
    }
    try {
      await renameWorkflow({ workspaceName, workflowId: workflow._id, name });
      stopRenaming();
      router.refresh();
    } catch (err) {
      setRenameError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not rename workflow. Please try again.'
      );
    }
  }

  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `workflow-${workflow._id}`,
    data: {
      kind: 'workflow',
      id: workflow._id,
      name: workflow.name,
    } satisfies DragData,
    disabled: isRenaming,
  });

  return (
    <TableRow
      ref={setNodeRef}
      {...listeners}
      className={cn('relative h-14', isDragging && 'opacity-50')}
    >
      <TableCell className='px-5'>
        {!isRenaming && (
          <Link
            href={`/${encodeURIComponent(workspaceName)}/workflow/${workflow._id}/canvas`}
            aria-label={workflow.name}
            draggable={false}
            className='absolute inset-0'
          />
        )}

        <span className='flex min-w-0 items-center gap-2.5'>
          <WorkflowIcon className='text-muted-foreground size-4 shrink-0' />
          <span className='flex min-w-0 flex-col gap-0.5'>
            {isRenaming ? (
              <span className='flex flex-col gap-1'>
                <Input
                  autoFocus
                  defaultValue={workflow.name}
                  aria-invalid={renameError ? true : undefined}
                  className='h-7 max-w-xs text-[13px]'
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      submitRename(event.currentTarget.value);
                    }
                    if (event.key === 'Escape') {
                      event.currentTarget.value = workflow.name;
                      stopRenaming();
                    }
                  }}
                  onBlur={(event) => {
                    submitRename(event.currentTarget.value);
                  }}
                />
                {renameError && (
                  <span className='text-destructive text-xs'>
                    {renameError}
                  </span>
                )}
              </span>
            ) : (
              <span
                className='truncate text-[13.5px] font-semibold tracking-tight'
              >
                {workflow.name}
              </span>
            )}
            {!isRenaming && workflow.description && (
              <span className='text-muted-foreground truncate text-xs'>
                {workflow.description}
              </span>
            )}
          </span>
        </span>
      </TableCell>

      <TableCell className='px-5'>
        <Badge
          variant='secondary'
          className={cn(
            'gap-1.5 rounded-full',
            workflow.isPublished
              ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
              : 'bg-muted text-muted-foreground'
          )}
        >
          <span className='size-1.25 rounded-full bg-current' />
          {workflow.isPublished ? 'Published' : 'Unpublished'}
        </Badge>
      </TableCell>

      <TableCell className='text-muted-foreground px-5 text-xs'>
        {formatTime(workflow._creationTime)}
      </TableCell>

      <TableCell className='px-5'>
        <Avatar size='sm' title={workflow.ownerName}>
          <AvatarFallback className='text-[10px] font-semibold'>
            {getInitials(workflow.ownerName)}
          </AvatarFallback>
        </Avatar>
      </TableCell>

      <TableCell className='px-5'>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                type='button'
                variant='ghost'
                size='icon'
                className='text-muted-foreground relative size-7'
                aria-label={`Actions for ${workflow.name}`}
              />
            }
          >
            <EllipsisVerticalIcon className='size-4' />
          </DropdownMenuTrigger>
          <DropdownMenuContent align='end' className='w-46'>
            <DropdownMenuItem
              onClick={() => {
                setRenameError(null);
                setIsRenaming(true);
              }}
            >
              <PencilIcon />
              Rename workflow
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              <Trash2Icon />
              Delete workflow
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
