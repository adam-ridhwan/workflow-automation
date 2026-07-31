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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatCreated } from '@/lib/format-created-time';
import { getInitials } from '@/lib/get-initials';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { DeleteWorkflowDialog } from './delete-workflow-dialog';

import type { Workflow } from '@/convex/workflows';

function StatusBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <Badge
      variant='secondary'
      className={cn(
        'gap-1.5 rounded-full',
        isPublished
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span className='size-1.25 rounded-full bg-current' />
      {isPublished ? 'Published' : 'Unpublished'}
    </Badge>
  );
}

type WorkflowsTableProps = {
  workflows: Workflow[];
  workspaceName: string;
  isFiltered: boolean;
};

export function WorkflowsTable({
  workflows,
  workspaceName,
  isFiltered,
}: WorkflowsTableProps) {
  const router = useRouter();
  const renameWorkflow = useMutation(api.workflows.rename);
  const [renamingId, setRenamingId] = useState<Workflow['_id'] | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);

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

  return (
    <div className='flex flex-1 flex-col'>
      <Table className='table-fixed'>
        <TableHeader>
          <TableRow className='hover:bg-transparent'>
            <TableHead
              className='text-muted-foreground h-9 px-5 text-[11px] font-medium
                tracking-wider uppercase'
            >
              Workflow
            </TableHead>

            <TableHead
              className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Status
            </TableHead>

            <TableHead
              className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Created
            </TableHead>

            <TableHead
              className='text-muted-foreground h-9 w-[15%] px-5 text-[11px]
                font-medium tracking-wider uppercase'
            >
              Owner
            </TableHead>

            <TableHead className='h-9 w-[5%] px-5'>
              <span className='sr-only'>Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {workflows.length === 0 ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={5}
                className='text-muted-foreground h-24 px-5 text-center
                  text-[13px]'
              >
                {isFiltered
                  ? 'Nothing matches your search or filters. Try broadening or clearing them.'
                  : 'No workflows yet. Create your first one.'}
              </TableCell>
            </TableRow>
          ) : (
            workflows.map((workflow) => {
              const isRenaming = renamingId === workflow._id;
              return (
                <TableRow key={workflow._id} className='relative'>
                  <TableCell className='px-5 py-3'>
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
                                // Prevent the blur handler from re-submitting
                                // the value being discarded.
                                event.currentTarget.value = workflow.name;
                                stopRenaming();
                              }
                            }}
                            onBlur={(event) => {
                              void submitRename(
                                workflow,
                                event.currentTarget.value
                              );
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
                    <StatusBadge isPublished={workflow.isPublished} />
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
                            setDeleteTarget(workflow);
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
            })
          )}
        </TableBody>
      </Table>

      <div
        className='text-muted-foreground mt-auto flex h-10.5 items-center
          justify-between border-t px-5 text-[11.5px]'
      >
        <span>
          {workflows.length} {workflows.length === 1 ? 'workflow' : 'workflows'}{' '}
          in {workspaceName}
        </span>
      </div>

      <DeleteWorkflowDialog
        workspaceName={workspaceName}
        workflow={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
