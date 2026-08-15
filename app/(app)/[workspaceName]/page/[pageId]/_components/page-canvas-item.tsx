'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import { useDraggable } from '@dnd-kit/core';

import {
  MIN_COMPONENT_H,
  MIN_COMPONENT_W,
  snap,
} from '../_constants/page-component-meta';
import { snapResize } from '../_lib/snap-to-components';
import { usePageStore } from '../_store/page-store';
import { PageComponentView } from './page-component-view';

import type { Id } from '@/convex/_generated/dataModel';
import type { PageComponentData } from '@/convex/pageLayout';

export type PlacedPageDragData = { kind: 'placed'; id: string };

type PageCanvasItemProps = {
  component: PageComponentData;
  target: { workspaceName: string; pageId: Id<'pages'> };
};

export function PageCanvasItem({ component, target }: PageCanvasItemProps) {
  const selectedId = usePageStore((s) => s.selectedId);
  const select = usePageStore((s) => s.select);
  const resizeComponent = usePageStore((s) => s.resizeComponent);
  const setGuides = usePageStore((s) => s.setGuides);
  const isSelected = selectedId === component.id;

  // Live size while dragging the resize handle; committed to the store on
  // pointer-up so we don't fire a save per frame.
  const [liveSize, setLiveSize] = useState<{ w: number; h: number } | null>(
    null
  );
  const [isResizing, setIsResizing] = useState(false);

  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({
      id: component.id,
      data: { kind: 'placed', id: component.id } satisfies PlacedPageDragData,
      disabled: isResizing,
    });

  const width = liveSize?.w ?? component.w;
  const height = liveSize?.h ?? component.h;

  function handleResizeStart(e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const startW = component.w;
    const startH = component.h;

    const otherRects = () =>
      usePageStore
        .getState()
        .components.filter((c) => c.id !== component.id)
        .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));

    function onMove(moveEvent: PointerEvent) {
      const rawW = Math.max(MIN_COMPONENT_W, startW + (moveEvent.clientX - startX));
      const rawH = Math.max(MIN_COMPONENT_H, startH + (moveEvent.clientY - startY));
      const result = snapResize(
        { x: component.x, y: component.y, w: rawW, h: rawH },
        otherRects()
      );
      setLiveSize({ w: result.w, h: result.h });
      setGuides(result.guideX, result.guideY);
    }

    function onUp(upEvent: PointerEvent) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setIsResizing(false);
      setGuides(null, null);
      const rawW = Math.max(MIN_COMPONENT_W, startW + (upEvent.clientX - startX));
      const rawH = Math.max(MIN_COMPONENT_H, startH + (upEvent.clientY - startY));
      const result = snapResize(
        { x: component.x, y: component.y, w: rawW, h: rawH },
        otherRects()
      );
      setLiveSize(null);
      resizeComponent(target, component.id, {
        w: result.guideX !== null ? result.w : snap(rawW),
        h: result.guideY !== null ? result.h : snap(rawH),
      });
    }

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={(e) => {
        e.stopPropagation();
        select(component.id);
      }}
      style={{
        left: component.x,
        top: component.y,
        width,
        height,
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className={cn(
        `group/item absolute cursor-grab rounded-lg border border-transparent
        p-1 active:cursor-grabbing`,
        isSelected && 'border-primary ring-primary/30 ring-2',
        !isSelected && 'hover:border-border',
        isDragging && 'z-10 opacity-80'
      )}
    >
      {/* Inner content is non-interactive in the builder so clicks select/drag
          the item instead of focusing the field. */}
      <div className='pointer-events-none h-full w-full'>
        <PageComponentView component={component} mode='edit' />
      </div>

      {isSelected && (
        <div
          onPointerDown={handleResizeStart}
          className='bg-primary absolute -right-1 -bottom-1 size-3 cursor-se-resize
            rounded-sm'
        />
      )}
    </div>
  );
}
