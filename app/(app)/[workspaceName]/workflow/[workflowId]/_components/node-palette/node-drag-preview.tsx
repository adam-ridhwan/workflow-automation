'use client';

import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { DragOverlay } from '@dnd-kit/core';

import { NODE_META } from '../../_constants/node-meta';
import { snapCenterToCursor } from '../../_lib/snap-center-to-cursor';

type NodeDragPreviewProps = {
  dragItem: PaletteDragData | null;
};

export type PaletteDragData = {
  uid: string;
  label: string;
};

/** Cursor-attached clone of the canvas node while dragging from the
 * palette; portaled to the body so it floats above everything. */
export function NodeDragPreview({ dragItem }: NodeDragPreviewProps) {
  if (typeof document === 'undefined') {
    return null;
  }

  const meta = dragItem ? NODE_META[dragItem.uid] : null;
  const Icon = meta?.icon;

  return createPortal(
    <DragOverlay
      dropAnimation={null}
      modifiers={[snapCenterToCursor]}
      style={{ width: 'auto', height: 'auto' }}
      className='pointer-events-none'
    >
      {dragItem && (
        <Card
          className='flex h-14 w-64 flex-row items-center gap-2.5 rounded-md p-0
            px-3 shadow-sm'
        >
          {Icon && (
            <div
              className='bg-muted flex size-8 shrink-0 items-center
                justify-center rounded-md'
            >
              <Icon className='text-muted-foreground size-4' />
            </div>
          )}
          <div className='flex min-w-0 flex-col'>
            <div className='truncate text-[13px] font-medium'>
              {dragItem.label}
            </div>
            {meta?.description && (
              <div className='text-muted-foreground truncate text-[11px]'>
                {meta.description}
              </div>
            )}
          </div>
        </Card>
      )}
    </DragOverlay>,
    document.body
  );
}
