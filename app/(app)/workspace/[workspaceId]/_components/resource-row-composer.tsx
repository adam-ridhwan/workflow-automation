'use client';

import { createContext, useContext } from 'react';
import { Input } from '@/components/ui/input';
import { TableCell, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/cn';
import { useDraggable, useDroppable } from '@dnd-kit/core';
import Link from 'next/link';

import type { DragData, DropTargetData } from './workspace-dnd-provider';

/**
 * `resourceRowComposer` is a utility function that provides a set of React
 * components for building a single resource table row (a workflow, file, or
 * folder). It is purely structural: the `Row` owns the draggable/droppable
 * `<TableRow>` and the cells own layout, but the rename state (and its
 * handlers) is owned by the consumer that creates the composer and passed in
 * to `NameCell`.
 *
 * @example
 * const WorkflowRow = resourceRowComposer<Workflow>();
 *
 * function WorkflowsTableRow({ workflow }: { workflow: Workflow }) {
 *   const [isRenaming, setIsRenaming] = useState(false);
 *   // …startRename / stopRename / submitRename live here…
 *   return (
 *     <WorkflowRow.Provider resource={workflow}>
 *       <WorkflowRow.Row
 *         drag={{ kind: 'workflow', id: workflow._id, name: workflow.name }}
 *         dragDisabled={isRenaming}
 *       >
 *         <WorkflowRow.NameCell
 *           icon={<WorkflowIcon />}
 *           name={workflow.name}
 *           href={`/w/${workflow._id}`}
 *           isRenaming={isRenaming}
 *           onRenameSubmit={submitRename}
 *           onRenameCancel={stopRename}
 *         />
 *         <WorkflowRow.Cell>{status}</WorkflowRow.Cell>
 *         <WorkflowRow.Actions>
 *           <MoreMenu onRename={startRename} />
 *         </WorkflowRow.Actions>
 *       </WorkflowRow.Row>
 *     </WorkflowRow.Provider>
 *   );
 * }
 */
export function resourceRowComposer<TResource>() {
  const ResourceContext = createContext<TResource | null>(null);

  function Provider({
    resource,
    children,
  }: {
    resource: TResource;
    children: React.ReactNode;
  }) {
    return (
      <ResourceContext.Provider value={resource}>
        {children}
      </ResourceContext.Provider>
    );
  }

  function useResource() {
    const context = useContext(ResourceContext);
    if (!context) throw new Error('useResource must be used within Provider');
    return context;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // region Row
  // ───────────────────────────────────────────────────────────────────────────
  function Row({
    drag,
    drop,
    dragDisabled,
    children,
  }: {
    /** Identifies the row as a drag source. */
    drag: DragData;
    /** When set, the row is also a drop target (used by folders). */
    drop?: DropTargetData;
    /** Suppresses dragging — e.g. while the name is being renamed inline. */
    dragDisabled?: boolean;
    children: React.ReactNode;
  }) {
    const {
      setNodeRef: setDragRef,
      listeners,
      isDragging,
    } = useDraggable({
      id: `${drag.kind}-${drag.id}`,
      data: drag,
      disabled: dragDisabled,
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
        {children}
      </TableRow>
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // region NameCell
  // ───────────────────────────────────────────────────────────────────────────
  function NameCell({
    icon,
    name,
    subtitle,
    href,
    hrefExternal,
    isRenaming,
    renameError,
    onRenameSubmit,
    onRenameCancel,
  }: {
    icon: React.ReactNode;
    name: string;
    subtitle?: React.ReactNode;
    /** Row link; omit for a non-navigable row. */
    href?: string;
    /** Render `href` as a plain external anchor (new tab) rather than a
     * client-side <Link> — e.g. a file's storage URL. */
    hrefExternal?: boolean;
    /** Rename state, owned by the consumer. */
    isRenaming?: boolean;
    renameError?: string | null;
    onRenameSubmit?: (value: string) => void;
    onRenameCancel?: () => void;
  }) {
    return (
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
                      onRenameSubmit?.(e.currentTarget.value);
                    }
                    if (e.key === 'Escape') {
                      e.currentTarget.value = name;
                      onRenameCancel?.();
                    }
                  }}
                  onBlur={(e) => {
                    onRenameSubmit?.(e.currentTarget.value);
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
    );
  }

  // ───────────────────────────────────────────────────────────────────────────
  // region Cell
  // ───────────────────────────────────────────────────────────────────────────
  function Cell({
    children,
    className,
  }: {
    children: React.ReactNode;
    className?: string;
  }) {
    return <TableCell className={cn('px-5', className)}>{children}</TableCell>;
  }

  // ───────────────────────────────────────────────────────────────────────────
  // region Actions
  // ───────────────────────────────────────────────────────────────────────────
  /** The trailing actions cell (the kebab menu). */
  function Actions({ children }: { children: React.ReactNode }) {
    return <TableCell className='px-5'>{children}</TableCell>;
  }

  return {
    useResource,
    Provider,
    Row,
    NameCell,
    Cell,
    Actions,
  };
}
