'use client';

import { useDraggable } from '@dnd-kit/core';

import { PAGE_COMPONENT_META } from '../_constants/page-component-meta';

import type { PageComponentType } from '@/convex/pageLayout';

export type PalettePageDragData = { type: PageComponentType };

type PagePaletteItemProps = {
  type: PageComponentType;
};

export function PagePaletteItem({ type }: PagePaletteItemProps) {
  const meta = PAGE_COMPONENT_META[type];
  const Icon = meta.icon;
  const { setNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `palette-${type}`,
    data: { type } satisfies PalettePageDragData,
  });

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
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
