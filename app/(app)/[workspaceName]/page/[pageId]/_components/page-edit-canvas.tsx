'use client';

import { usePageStore } from '../_store/page-store';
import { PageCanvasItem } from './page-canvas-item';

import type { Id } from '@/convex/_generated/dataModel';

type PageEditCanvasProps = {
  target: { workspaceName: string; pageId: Id<'pages'> };
  wrapperRef: React.RefObject<HTMLDivElement | null>;
};

export function PageEditCanvas({ target, wrapperRef }: PageEditCanvasProps) {
  const components = usePageStore((s) => s.components);
  const select = usePageStore((s) => s.select);
  const guideX = usePageStore((s) => s.guideX);
  const guideY = usePageStore((s) => s.guideY);

  // Guide lines run the length of the working area (max component extent).
  const contentW = components.reduce((m, c) => Math.max(m, c.x + c.w), 0) + 400;
  const contentH = components.reduce((m, c) => Math.max(m, c.y + c.h), 0) + 400;

  return (
    <div
      ref={wrapperRef}
      onClick={() => {
        select(null);
      }}
      className='bg-canvas relative min-h-0 flex-1 overflow-auto'
      style={{
        backgroundImage:
          'radial-gradient(var(--color-border) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {components.map((component) => (
        <PageCanvasItem
          key={component.id}
          component={component}
          target={target}
        />
      ))}

      {guideX !== null && (
        <div
          className='bg-primary pointer-events-none absolute top-0 z-20 w-px'
          style={{ left: guideX, height: contentH }}
        />
      )}
      {guideY !== null && (
        <div
          className='bg-primary pointer-events-none absolute left-0 z-20 h-px'
          style={{ top: guideY, width: contentW }}
        />
      )}

      {components.length === 0 && (
        <div
          className='text-muted-foreground pointer-events-none absolute inset-0
            flex items-center justify-center text-sm'
        >
          Drag components from the left to build your page.
        </div>
      )}
    </div>
  );
}
