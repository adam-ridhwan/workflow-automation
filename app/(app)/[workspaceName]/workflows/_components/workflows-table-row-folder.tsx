'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
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
import { formatCreated } from '@/lib/format-created-time';
import { getInitials } from '@/lib/get-initials';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  EllipsisVerticalIcon,
  FolderIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type {
  DragData,
  DropTargetData,
} from '../../_components/workspace-dnd-provider';
import type { Folder } from '@/convex/folders';

type FolderRowProps = {
  folder: Folder;
  workspaceName: string;
  onDelete: () => void;
};

export function FolderRow({ folder, workspaceName, onDelete }: FolderRowProps) {
  const router = useRouter();
  const renameFolder = useMutation(api.folders.rename);
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  function stopRenaming() {
    setIsRenaming(false);
    setRenameError(null);
  }

  async function submitRename(rawName: string) {
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

  const {
    setNodeRef: setDragRef,
    listeners,
    isDragging,
  } = useDraggable({
    id: `folder-${folder._id}`,
    data: {
      kind: 'folder',
      id: folder._id,
      name: folder.name,
    } satisfies DragData,
    disabled: isRenaming,
  });
  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({
    id: `folder-drop-${folder._id}`,
    data: {
      folderId: folder._id,
      folderName: folder.name,
    } satisfies DropTargetData,
  });
  const activeData = active?.data.current as DragData | undefined;
  const isDraggingSelf =
    activeData?.kind === 'folder' && activeData.id === folder._id;

  return (
    <TableRow
      ref={(node: HTMLTableRowElement | null) => {
        setDragRef(node);
        setDropRef(node);
      }}
      {...listeners}
      className={cn(
        'relative h-14',
        isOver && !isDraggingSelf && 'bg-muted/60 hover:bg-muted/60',
        isDragging && 'opacity-50'
      )}
    >
      <TableCell className='px-5'>
        {!isRenaming && (
          <Link
            href={`/${encodeURIComponent(workspaceName)}/workflows/folder/${folder._id}`}
            aria-label={folder.name}
            draggable={false}
            className='absolute inset-0'
          />
        )}
        <span className='flex min-w-0 items-center gap-2.5'>
          <FolderIcon
            className='text-muted-foreground size-4 shrink-0 fill-current'
          />
          {isRenaming ? (
            <span className='flex flex-col gap-1'>
              <Input
                autoFocus
                defaultValue={folder.name}
                aria-invalid={renameError ? true : undefined}
                className='h-7 max-w-xs text-[13px]'
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void submitRename(event.currentTarget.value);
                  }
                  if (event.key === 'Escape') {
                    event.currentTarget.value = folder.name;
                    stopRenaming();
                  }
                }}
                onBlur={(event) => {
                  void submitRename(event.currentTarget.value);
                }}
              />
              {renameError && (
                <span className='text-destructive text-xs'>{renameError}</span>
              )}
            </span>
          ) : (
            <span
              className='truncate text-[13.5px] font-semibold tracking-tight'
            >
              {folder.name}
            </span>
          )}
        </span>
      </TableCell>

      <TableCell className='text-muted-foreground px-5 text-xs'>—</TableCell>

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
                setIsRenaming(true);
              }}
            >
              <PencilIcon />
              Rename folder
            </DropdownMenuItem>
            <DropdownMenuItem onClick={onDelete}>
              <Trash2Icon />
              Delete folder
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
