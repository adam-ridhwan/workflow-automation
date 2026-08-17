'use client';

import { useDraggable } from '@dnd-kit/core';

import { NODE_META } from '../../_constants/node-meta';

import type { PaletteDragData } from './node-drag-preview';

type NodePaletteItemProps = {
  uid: string;
};

export function NodePaletteItem({ uid }: NodePaletteItemProps) {
  const meta = NODE_META[uid];
  const { setNodeRef, listeners, isDragging } = useDraggable({
    id: `palette-${uid}`,
    data: { uid, label: meta?.label ?? uid } satisfies PaletteDragData,
  });

  if (!meta) {
    return null;
  }
  const Icon = meta.icon;

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      data-dragging={isDragging ? '' : undefined}
      className='hover:bg-accent hover:text-accent-foreground flex cursor-grab
        items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium
        select-none active:cursor-grabbing data-dragging:opacity-50'
    >
      <Icon className='text-muted-foreground size-3.5 shrink-0' />
      {meta.label}
    </div>
  );
}
