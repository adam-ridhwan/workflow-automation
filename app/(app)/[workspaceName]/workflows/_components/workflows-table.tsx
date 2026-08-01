'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Table } from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { FolderIcon, WorkflowIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { DeleteFolderDialog } from '../../_components/delete-folder-dialog';
import { DeleteWorkflowDialog } from './delete-workflow-dialog';
import { WorkflowsTableBody } from './workflows-table-body';

import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';

export type DragData =
  | { kind: 'workflow'; id: Workflow['_id']; name: string }
  | { kind: 'folder'; id: Folder['_id']; name: string };

// Position the drag overlay so its top-left corner rides the cursor.
const snapTopLeftToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (draggingNodeRect && activatorEvent instanceof PointerEvent) {
    return {
      ...transform,
      x: transform.x + (activatorEvent.clientX - draggingNodeRect.left),
      y: transform.y + (activatorEvent.clientY - draggingNodeRect.top),
    };
  }
  return transform;
};

type WorkflowsTableProps = {
  workflows: Workflow[];
  folders?: Folder[];
  workspaceName: string;
  isFiltered: boolean;
};

export function WorkflowsTable({
  workflows,
  folders,
  workspaceName,
  isFiltered,
}: WorkflowsTableProps) {
  const router = useRouter();
  const moveWorkflow = useMutation(api.workflows.move);
  const moveFolder = useMutation(api.folders.move);
  const [deleteTarget, setDeleteTarget] = useState<Workflow | null>(null);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null
  );
  const [dragItem, setDragItem] = useState<DragData | null>(null);
  const [moveError, setMoveError] = useState<string | null>(null);
  // Dropping releases the pointer over a row, which fires a click that would
  // navigate; the capture handler below swallows it.
  const justDroppedRef = useRef(false);
  const sensors = useSensors(
    // The activation distance keeps plain clicks (row links, menus)
    // working; a drag only starts after the pointer moves.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setMoveError(null);
    setDragItem((event.active.data.current as DragData | undefined) ?? null);
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDragItem(null);
    justDroppedRef.current = true;
    setTimeout(() => {
      justDroppedRef.current = false;
    }, 0);

    const item = event.active.data.current as DragData | undefined;
    const target = event.over?.data.current as
      { folderId: Folder['_id'] } | undefined;
    if (item === undefined || target === undefined) {
      return;
    }
    if (item.kind === 'folder' && item.id === target.folderId) {
      return;
    }
    try {
      if (item.kind === 'workflow') {
        await moveWorkflow({
          workspaceName,
          workflowId: item.id,
          folderId: target.folderId,
        });
      } else {
        await moveFolder({
          workspaceName,
          folderId: item.id,
          parentId: target.folderId,
        });
      }
      router.refresh();
    } catch (err) {
      setMoveError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : `Could not move ${item.name}. Please try again.`
      );
    }
  }

  return (
    <div
      className='flex flex-1 flex-col'
      onClickCapture={(event) => {
        if (justDroppedRef.current) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      {moveError && (
        <div className='text-destructive border-b px-5 py-2 text-xs'>
          {moveError}
        </div>
      )}

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDragItem(null);
        }}
      >
        <Table className='table-fixed'>
          <colgroup>
            <col />
            <col className='w-[15%]' />
            <col className='w-[15%]' />
            <col className='w-[15%]' />
            <col className='w-[5%]' />
          </colgroup>

          <WorkflowsTableBody
            workflows={workflows}
            folders={folders}
            workspaceName={workspaceName}
            isFiltered={isFiltered}
            dragItem={dragItem}
            onDelete={setDeleteTarget}
            onDeleteFolder={setFolderDeleteTarget}
          />
        </Table>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay
              dropAnimation={null}
              modifiers={[snapTopLeftToCursor]}
              style={{ width: 'auto', height: 'auto' }}
              className='pointer-events-none'
            >
              {dragItem && (
                <div
                  className='bg-background text-foreground flex items-center
                    gap-2 rounded-md border px-3 py-1.5 text-[13px] font-medium
                    shadow-md'
                >
                  {dragItem.kind === 'folder' ? (
                    <FolderIcon
                      className='text-muted-foreground size-3.5 shrink-0
                        fill-current'
                    />
                  ) : (
                    <WorkflowIcon
                      className='text-muted-foreground size-3.5 shrink-0'
                    />
                  )}
                  <span className='max-w-56 truncate'>{dragItem.name}</span>
                </div>
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>

      <div
        className='text-muted-foreground mt-auto flex h-10.5 items-center
          justify-between border-t px-5 text-[11.5px]'
      >
        <span>
          {workflows.length}{' '}
          {workflows.length === 1 ? 'workflow' : 'workflows'}{' '}
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
      <DeleteFolderDialog
        workspaceName={workspaceName}
        folder={folderDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
