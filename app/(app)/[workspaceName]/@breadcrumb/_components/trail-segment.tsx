'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useDroppable } from '@dnd-kit/core';
import {
  ChevronRightIcon,
  FileIcon,
  FolderIcon,
  LayoutTemplateIcon,
  WorkflowIcon,
} from 'lucide-react';
import Link from 'next/link';

import type { DropTargetData } from '../../_components/workspace-dnd-provider';
import type { Folder } from '@/convex/folders';

type TrailSegmentProps = {
  name: string;
  href: string;
  icon: 'folder' | 'workflow' | 'file' | 'page';
  isCurrent: boolean;
  /** Set on folder segments to make them drop targets for moves. */
  folderId?: Folder['_id'];
};

export function TrailSegment({
  name,
  href,
  icon,
  isCurrent,
  folderId,
}: TrailSegmentProps) {
  // The current segment is the folder being viewed — dropping there would be
  // a no-op, so it isn't a target.
  const isDroppable = folderId !== undefined && !isCurrent;
  const { setNodeRef, isOver } = useDroppable({
    id: `trail-folder-${folderId ?? href}`,
    data:
      folderId === undefined
        ? undefined
        : ({ folderId, folderName: name } satisfies DropTargetData),
    disabled: !isDroppable,
  });

  const Icon = {
    folder: FolderIcon,
    workflow: WorkflowIcon,
    file: FileIcon,
    page: LayoutTemplateIcon,
  }[icon];
  return (
    <span className='flex min-w-0 items-center gap-1'>
      <ChevronRightIcon className='text-muted-foreground size-3 shrink-0' />
      <Button
        ref={setNodeRef}
        variant='ghost'
        nativeButton={false}
        render={
          <Link href={href} aria-current={isCurrent ? 'page' : undefined} />
        }
        className={cn(
          'min-w-0 gap-1.5 px-2 text-[13px]',
          isCurrent
            ? 'font-semibold tracking-tight'
            : 'text-muted-foreground hover:text-foreground font-medium',
          isOver && 'bg-muted text-foreground'
        )}
      >
        <Icon className='size-3.5 shrink-0' />
        <span className='truncate'>{name}</span>
      </Button>
    </span>
  );
}
