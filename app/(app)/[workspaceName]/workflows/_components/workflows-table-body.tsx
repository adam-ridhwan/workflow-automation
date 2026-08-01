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
import {
  EllipsisVerticalIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';

type WorkflowsTableBodyProps = {
  workflows: Workflow[];
  folders?: Folder[];
  workspaceName: string;
  isFiltered: boolean;
  onDelete: (workflow: Workflow) => void;
  onDeleteFolder: (folder: Folder) => void;
};

export function WorkflowsTableBody({
  workflows,
  folders = [],
  workspaceName,
  isFiltered,
  onDelete,
  onDeleteFolder,
}: WorkflowsTableBodyProps) {
  const router = useRouter();
  const renameWorkflow = useMutation(api.workflows.rename);
  const renameFolder = useMutation(api.folders.rename);
  const [renamingId, setRenamingId] = useState<Workflow['_id'] | null>(null);
  const [renamingFolderId, setRenamingFolderId] = useState<
    Folder['_id'] | null
  >(null);
  const [renameError, setRenameError] = useState<string | null>(null);

  function stopRenaming() {
    setRenamingId(null);
    setRenamingFolderId(null);
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

  async function submitFolderRename(folder: Folder, rawName: string) {
    const name = rawName.trim();
    if (name.length === 0 || name === folder.name) {
      stopRenaming();
      return;
    }
    try {
      await renameFolder({ workspaceName, folderId: folder._id, name });
      stopRenaming();
      router.refresh();
    } catch (err) {
      setRenameError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not rename folder. Please try again.'
      );
    }
  }

  if (workflows.length === 0 && folders.length === 0) {
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
      {folders.map((folder) => {
        const isRenamingFolder = renamingFolderId === folder._id;
        return (
          <TableRow key={folder._id} className='relative h-14'>
            <TableCell className='px-5'>
              {!isRenamingFolder && (
                <Link
                  href={`/${encodeURIComponent(workspaceName)}/workflows/folder/${folder._id}`}
                  aria-label={folder.name}
                  className='absolute inset-0'
                />
              )}
              <span className='flex min-w-0 items-center gap-2.5'>
                <FolderIcon
                  className='text-muted-foreground size-4 shrink-0 fill-current'
                />
                {isRenamingFolder ? (
                  <span className='flex flex-col gap-1'>
                    <Input
                      autoFocus
                      defaultValue={folder.name}
                      aria-invalid={renameError ? true : undefined}
                      className='h-7 max-w-xs text-[13px]'
                      onKeyDown={(event) => {
                        if (event.key === 'Enter') {
                          event.preventDefault();
                          void submitFolderRename(
                            folder,
                            event.currentTarget.value
                          );
                        }
                        if (event.key === 'Escape') {
                          event.currentTarget.value = folder.name;
                          stopRenaming();
                        }
                      }}
                      onBlur={(event) => {
                        void submitFolderRename(
                          folder,
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
                    {folder.name}
                  </span>
                )}
              </span>
            </TableCell>

            <TableCell className='text-muted-foreground px-5 text-xs'>
              —
            </TableCell>

            <TableCell className='text-muted-foreground px-5 text-xs'>
              {formatCreated(folder._creationTime)}
            </TableCell>

            <TableCell className='px-5'>
              <Avatar size='sm' title={folder.createdByName}>
                <AvatarFallback className='text-[10px] font-semibold'>
                  {getInitials(folder.createdByName)}
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
                      aria-label={`Actions for ${folder.name}`}
                    />
                  }
                >
                  <EllipsisVerticalIcon className='size-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-46'>
                  <DropdownMenuItem
                    onClick={() => {
                      setRenameError(null);
                      setRenamingFolderId(folder._id);
                    }}
                  >
                    <PencilIcon />
                    Rename folder
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => {
                      onDeleteFolder(folder);
                    }}
                  >
                    <Trash2Icon />
                    Delete folder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        );
      })}

      {workflows.map((workflow) => {
        const isRenaming = renamingId === workflow._id;
        return (
          <TableRow key={workflow._id} className='relative h-14'>
            <TableCell className='px-5'>
              {!isRenaming && (
                <Link
                  href={`/${encodeURIComponent(workspaceName)}/workflow/${workflow._id}`}
                  aria-label={workflow.name}
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
