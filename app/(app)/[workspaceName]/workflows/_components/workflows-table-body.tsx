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
import { TableBody, TableCell, TableRow } from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatCreated } from '@/lib/format-created-time';
import { getInitials } from '@/lib/get-initials';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Workflow } from '@/convex/workflows';

type WorkflowsTableBodyProps = {
  workflows: Workflow[];
  workspaceName: string;
  isFiltered: boolean;
  onDelete: (workflow: Workflow) => void;
};

export function WorkflowsTableBody({
  workflows,
  workspaceName,
  isFiltered,
  onDelete,
}: WorkflowsTableBodyProps) {
  const router = useRouter();
  const renameWorkflow = useMutation(api.workflows.rename);
  const [renamingId, setRenamingId] = useState<Workflow['_id'] | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  function stopRenaming() {
    setRenamingId(null);
    setRenameError(null);
  }

  async function submitRename(workflow: Workflow, rawName: string) {
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

  if (workflows.length === 0) {
    return (
      <TableBody>
        <TableRow className='hover:bg-transparent'>
          <TableCell
            colSpan={5}
            className='text-muted-foreground h-24 px-5 text-center text-[13px]'
          >
            {isFiltered
              ? 'Nothing matches your search or filters. Try broadening or clearing them.'
              : 'No workflows yet. Create your first one.'}
          </TableCell>
        </TableRow>
      </TableBody>
    );
  }

  return (
    <TableBody>
      {workflows.map((workflow) => {
        const isRenaming = renamingId === workflow._id;
        return (
          <TableRow key={workflow._id} className='relative'>
            <TableCell className='h-5 px-5'>
              {!isRenaming && (
                <Link
                  href={`/${encodeURIComponent(workspaceName)}/workflows/${workflow._id}`}
                  aria-label={workflow.name}
                  className='absolute inset-0'
                />
              )}

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
                          void submitRename(
                            workflow,
                            event.currentTarget.value
                          );
                        }
                        if (event.key === 'Escape') {
                          event.currentTarget.value = workflow.name;
                          stopRenaming();
                        }
                      }}
                      onBlur={(event) => {
                        void submitRename(workflow, event.currentTarget.value);
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
                    className='truncate text-[13.5px] font-semibold
                      tracking-tight'
                  >
                    {workflow.name}
                  </span>
                )}
                {workflow.description && (
                  <span className='text-muted-foreground truncate text-xs'>
                    {workflow.description}
                  </span>
                )}
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
              {formatCreated(workflow._creationTime)}
            </TableCell>

            <TableCell className='px-5'>
              <Avatar size='sm' title={workflow.createdByName}>
                <AvatarFallback className='text-[10px] font-semibold'>
                  {getInitials(workflow.createdByName)}
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
                      setRenamingId(workflow._id);
                    }}
                  >
                    <PencilIcon />
                    Rename workflow
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onDelete(workflow);
                    }}
                  >
                    <Trash2Icon />
                    Delete workflow
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      })}
    </TableBody>
  );
}
