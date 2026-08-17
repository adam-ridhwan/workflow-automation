'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import { ConvexError } from 'convex/values';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import type { DragData, DropTargetData } from './workspace-dnd-provider';

type ResourceRowShellProps = {
  /** Identifies the row as a drag source. */
  drag: DragData;
  /** When set, the row is also a drop target (used by folders). */
  drop?: DropTargetData;
  /** Row link; omit for a non-navigable row. */
  href?: string;
  /** Render `href` as a plain external anchor (new tab) rather than a
   * client-side <Link> — e.g. a file's storage URL. */
  hrefExternal?: boolean;
  icon: React.ReactNode;
  name: string;
  subtitle?: React.ReactNode;
  /** The middle <TableCell>s between the name and the actions column. */
  cells: React.ReactNode;
  onRename: (name: string) => Promise<unknown>;
  renameErrorFallback: string;
  /** The trailing actions <TableCell> (the kebab menu). Receives `startRename`
   * so its Rename item can drive the shell-owned inline rename input. Usually
   * a `<ResourceRowActions>`. */
  actions: (helpers: { startRename: () => void }) => React.ReactNode;
};

/** The shared skeleton for a workflow, file, or folder row: a draggable (and
 * optionally droppable) table row with an overlaid link, inline renaming, and a
 * kebab menu. Callers supply the icon, name, subtitle, middle cells, and the
 * rename/delete handlers. */
export function ResourceRowShell({
  drag,
  drop,
  href,
  hrefExternal,
  icon,
  name,
  subtitle,
  cells,
  onRename,
  renameErrorFallback,
  actions,
}: ResourceRowShellProps) {
  const router = useRouter();
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  function startRename() {
    setRenameError(null);
    setIsRenaming(true);
  }

  function stopRenaming() {
    setIsRenaming(false);
    setRenameError(null);
  }

  async function submitRename(rawName: string) {
    const nextName = rawName.trim();
    if (nextName.length === 0 || nextName === name) {
      stopRenaming();
      return;
    }
    try {
      await onRename(nextName);
      stopRenaming();
      router.refresh();
    } catch (err) {
      setRenameError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : renameErrorFallback
      );
    }
  }

  const {
    setNodeRef: setDragRef,
    listeners,
    isDragging,
  } = useDraggable({
    id: `${drag.kind}-${drag.id}`,
    data: drag,
    disabled: isRenaming,
  });
  const {
    setNodeRef: setDropRef,
    isOver,
    active,
  } = useDroppable({
    id: `drop-${drag.kind}-${drag.id}`,
    data: drop,
    disabled: drop === undefined,
  });
  const activeData = active?.data.current as DragData | undefined;
  // A folder can't be dropped onto itself.
  const isDraggingSelf =
    activeData !== undefined &&
    activeData.kind === drag.kind &&
    activeData.id === drag.id;

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
        {!isRenaming && href !== undefined && (
          <Link
            href={href}
            aria-label={name}
            draggable={false}
            className='absolute inset-0'
            {...(hrefExternal && { target: '_blank', rel: 'noreferrer' })}
          />
        )}

        <span className='flex min-w-0 items-center gap-2.5'>
          {icon}
          <span className='flex min-w-0 flex-col gap-0.5'>
            {isRenaming ? (
              <span className='flex flex-col gap-1'>
                <Input
                  autoFocus
                  defaultValue={name}
                  aria-invalid={renameError ? true : undefined}
                  className='h-7 max-w-xs text-[13px]'
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      submitRename(e.currentTarget.value);
                    }
                    if (e.key === 'Escape') {
                      e.currentTarget.value = name;
                      stopRenaming();
                    }
                  }}
                  onBlur={(e) => {
                    submitRename(e.currentTarget.value);
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
                {name}
              </span>
            )}
            {!isRenaming && subtitle && (
              <span className='text-muted-foreground truncate text-xs'>
                {subtitle}
              </span>
            )}
          </span>
        </span>
      </TableCell>

      {cells}

      {actions({ startRename })}
    </TableRow>
  );
}
