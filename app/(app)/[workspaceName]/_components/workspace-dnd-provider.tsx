'use client';

import { useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { toast } from '@/components/ui/toast';
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
import { useParams, useRouter } from 'next/navigation';

import { useWorkspaceName } from '../_hooks/use-workspace-name';

import type { Folder } from '@/convex/folders';
import type { Workflow } from '@/convex/workflows';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';

export type DragData =
  | { kind: 'workflow'; id: Workflow['_id']; name: string }
  | { kind: 'folder'; id: Folder['_id']; name: string };

/** Attached to droppables; `folderId` undefined means the workspace root. */
export type DropTargetData = {
  folderId: Folder['_id'] | undefined;
  folderName: string;
};

// Position the drag overlay so its top-left corner rides the cursor.
export const snapTopLeftToCursor: Modifier = ({
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

type WorkspaceDndProviderProps = {
  children: React.ReactNode;
};

/** Hosts the drag-and-drop context for moving workflows and folders. It
 * wraps the site header and the page content, so both table rows and the
 * breadcrumb trail can act as drop targets. */
export function WorkspaceDndProvider({ children }: WorkspaceDndProviderProps) {
  const router = useRouter();
  const workspaceName = useWorkspaceName();
  // Present on /workflows/folder/[folderId] routes; the location items are
  // moved from, so Undo knows where to put them back.
  const params = useParams<{ folderId?: Folder['_id'] }>();
  const moveWorkflow = useMutation(api.workflows.move);
  const moveFolder = useMutation(api.folders.move);
  const [dragItem, setDragItem] = useState<DragData | null>(null);
  // Dropping releases the pointer over a row, which fires a click that would
  // navigate; the capture handler below swallows it.
  const justDroppedRef = useRef(false);
  const sensors = useSensors(
    // The activation distance keeps plain clicks (row links, menus)
    // working; a drag only starts after the pointer moves.
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } })
  );

  function handleDragStart(event: DragStartEvent) {
    setDragItem((event.active.data.current as DragData | undefined) ?? null);
  }

  async function moveItem(item: DragData, folderId: Folder['_id'] | undefined) {
    if (item.kind === 'workflow') {
      await moveWorkflow({ workspaceName, workflowId: item.id, folderId });
    } else {
      await moveFolder({
        workspaceName,
        folderId: item.id,
        parentId: folderId,
      });
    }
    router.refresh();
  }

  function moveErrorMessage(err: unknown, item: DragData) {
    return err instanceof ConvexError && typeof err.data === 'string'
      ? err.data
      : `Could not move ${item.name}. Please try again.`;
  }

  async function handleDragEnd(event: DragEndEvent) {
    setDragItem(null);
    justDroppedRef.current = true;
    setTimeout(() => {
      justDroppedRef.current = false;
    }, 0);

    const item = event.active.data.current as DragData | undefined;
    const target = event.over?.data.current as DropTargetData | undefined;
    if (item === undefined || target === undefined) {
      return;
    }
    if (item.kind === 'folder' && item.id === target.folderId) {
      return;
    }
    // The list being viewed is where the item came from; dropping it there
    // again is a no-op.
    const sourceFolderId = params.folderId;
    if (target.folderId === sourceFolderId) {
      return;
    }
    try {
      await moveItem(item, target.folderId);
      toast.add({
        title: `Moved ${item.name} to ${target.folderName}`,
        actionProps: {
          children: 'Undo',
          onClick: () => {
            moveItem(item, sourceFolderId).catch((err: unknown) => {
              toast.add({
                type: 'error',
                title: moveErrorMessage(err, item),
              });
            });
          },
        },
      });
    } catch (err) {
      toast.add({ type: 'error', title: moveErrorMessage(err, item) });
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => {
        setDragItem(null);
      }}
    >
      <div
        style={{ display: 'contents' }}
        onClickCapture={(event) => {
          if (justDroppedRef.current) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        {children}
      </div>

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
                className='bg-background text-foreground flex items-center gap-2
                  rounded-md border px-3 py-1.5 text-[13px] font-medium
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
  );
}
