'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { useDraggable } from '@dnd-kit/core';
import { StretchHorizontalIcon } from 'lucide-react';

import {
  CONTAINER_PADDING,
  MIN_COMPONENT_H,
  MIN_COMPONENT_W,
  snap,
} from '../_constants/page-component-meta';
import { snapResizeBox } from '../_lib/snap-to-components';
import { usePageStore } from '../_store/page-store';
import { PageComponentView } from './page-component-view';

import type { Rect, ResizeEdges } from '../_lib/snap-to-components';
import type { Id } from '@/convex/_generated/dataModel';
import type { PageComponentData } from '@/convex/pageLayout';

export type PlacedPageDragData = { kind: 'placed'; id: string };

type Box = { x: number; y: number; w: number; h: number };

/** Draggable strips along each border to resize that edge. */
const EDGES: { key: string; className: string; edges: ResizeEdges }[] = [
  {
    key: 'n',
    className: 'top-0 right-2 left-2 -mt-1 h-2 cursor-ns-resize',
    edges: { top: true },
  },
  {
    key: 's',
    className: 'bottom-0 right-2 left-2 -mb-1 h-2 cursor-ns-resize',
    edges: { bottom: true },
  },
  {
    key: 'w',
    className: 'top-2 bottom-2 left-0 -ml-1 w-2 cursor-ew-resize',
    edges: { left: true },
  },
  {
    key: 'e',
    className: 'top-2 bottom-2 right-0 -mr-1 w-2 cursor-ew-resize',
    edges: { right: true },
  },
];

type PageCanvasItemProps = {
  component: PageComponentData;
  target: { workspaceId: Id<'workspaces'>; pageId: Id<'pages'> };
};

export function PageCanvasItem({ component, target }: PageCanvasItemProps) {
  const selectedId = usePageStore((s) => s.selectedId);
  const select = usePageStore((s) => s.select);
  const setBox = usePageStore((s) => s.setBox);
  const setFullWidth = usePageStore((s) => s.setFullWidth);
  const setGuides = usePageStore((s) => s.setGuides);
  const isSelected = selectedId === component.id;

  // Live box while dragging a resize handle; committed on pointer-up.
  const [liveBox, setLiveBox] = useState<Box | null>(null);
  const [isResizing, setIsResizing] = useState(false);

  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({
      id: component.id,
      data: { kind: 'placed', id: component.id } satisfies PlacedPageDragData,
      disabled: isResizing,
    });

  const left = liveBox?.x ?? component.x;
  const top = liveBox?.y ?? component.y;
  const width = liveBox?.w ?? component.w;
  const height = liveBox?.h ?? component.h;

  function otherRects(): Rect[] {
    const rects: Rect[] = usePageStore
      .getState()
      .components.filter((c) => c.id !== component.id)
      .map((c) => ({ x: c.x, y: c.y, w: c.w, h: c.h }));
    const surface = document.querySelector('[data-page-surface]');
    if (surface) {
      rects.push({
        x: CONTAINER_PADDING,
        y: CONTAINER_PADDING,
        w: surface.clientWidth - CONTAINER_PADDING * 2,
        h: surface.clientHeight - CONTAINER_PADDING * 2,
        silent: true,
      });
    }
    return rects;
  }

  function handleResizeStart(edges: ResizeEdges, e: React.PointerEvent) {
    e.stopPropagation();
    e.preventDefault();
    setIsResizing(true);
    const startX = e.clientX;
    const startY = e.clientY;
    const start = {
      x: component.x,
      y: component.y,
      w: component.w,
      h: component.h,
    };

    // Raw box from the pointer delta, keeping the opposite corner anchored.
    function rawBox(moveX: number, moveY: number): Box {
      const dx = moveX - startX;
      const dy = moveY - startY;
      let { x, y, w, h } = start;
      if (edges.right) {
        w = Math.max(MIN_COMPONENT_W, start.w + dx);
      }
      if (edges.left) {
        w = Math.max(MIN_COMPONENT_W, start.w - dx);
        x = start.x + start.w - w;
      }
      if (edges.bottom) {
        h = Math.max(MIN_COMPONENT_H, start.h + dy);
      }
      if (edges.top) {
        h = Math.max(MIN_COMPONENT_H, start.h - dy);
        y = start.y + start.h - h;
      }
      return { x, y, w, h };
    }

    function onMove(moveEvent: PointerEvent) {
      const result = snapResizeBox(
        rawBox(moveEvent.clientX, moveEvent.clientY),
        otherRects(),
        edges
      );
      setLiveBox({ x: result.x, y: result.y, w: result.w, h: result.h });
      setGuides(result.guideX, result.guideY);
    }

    function onUp(upEvent: PointerEvent) {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      setIsResizing(false);
      setGuides(null, null);
      const result = snapResizeBox(
        rawBox(upEvent.clientX, upEvent.clientY),
        otherRects(),
        edges
      );
      setLiveBox(null);
      // Grid-snap the axis that didn't align-snap to a guide.
      setBox(target, component.id, {
        x: result.guideX !== null ? result.x : snap(result.x),
        y: result.guideY !== null ? result.y : snap(result.y),
        w: result.guideX !== null ? result.w : snap(result.w),
        h: result.guideY !== null ? result.h : snap(result.h),
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
        left,
        top,
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
        <>
          <Button
            size='xs'
            title='Full width'
            variant='outline'
            className='absolute -top-8 right-0 shadow-sm'
            onPointerDown={(e) => {
              e.stopPropagation();
            }}
            onClick={(e) => {
              e.stopPropagation();
              const surface = document.querySelector('[data-page-surface]');
              if (surface) {
                setFullWidth(target, component.id, surface.clientWidth);
              }
            }}
          >
            <StretchHorizontalIcon />
            Full width
          </Button>

          {EDGES.map(({ key, className, edges }) => (
            <div
              key={key}
              onPointerDown={(e) => {
                handleResizeStart(edges, e);
              }}
              className={cn('absolute z-10', className)}
            />
          ))}
        </>
      )}
    </div>
  );
}
