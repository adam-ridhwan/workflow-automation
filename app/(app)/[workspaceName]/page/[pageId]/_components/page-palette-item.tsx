'use client';

import { cn } from '@/lib/cn';
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
      className={cn(
        `hover:border-primary/40 hover:bg-accent/40 flex cursor-grab items-center
        gap-2 rounded-lg border p-2 text-sm transition-colors select-none
        active:cursor-grabbing`,
        isDragging && 'opacity-40'
      )}
    >
      <Icon className='text-muted-foreground size-4 shrink-0' />
      <span className='truncate'>{meta.label}</span>
    </div>
  );
}
