'use client';

import { CONTAINER_PADDING } from '../_constants/page-component-meta';
import { usePageStore } from '../_store/page-store';
import { PageCanvasItem } from './page-canvas-item';

import type { Id } from '@/convex/_generated/dataModel';

type PageEditCanvasProps = {
  target: { workspaceId: Id<'workspaces'>; pageId: Id<'pages'> };
  wrapperRef: React.RefObject<HTMLDivElement | null>;
};

export function PageEditCanvas({ target, wrapperRef }: PageEditCanvasProps) {
  const components = usePageStore((s) => s.components);
  const select = usePageStore((s) => s.select);
  const guideX = usePageStore((s) => s.guideX);
  const guideY = usePageStore((s) => s.guideY);

  return (
    // Full-width dotted canvas — spans the entire area; the floating palette
    // and properties panel overlay its left/right edges.
    <div
      className='bg-canvas relative min-h-0 flex-1 overflow-hidden'
      style={{
        backgroundImage:
          'radial-gradient(var(--color-border) 1px, transparent 1px)',
        backgroundSize: '16px 16px',
      }}
    >
      {/* Inset region (clears the floating palette + properties panel) that
          centers the component container. */}
      <div className='absolute inset-0 flex justify-center py-4 pr-80 pl-60'>
        {/* The bordered container that holds the components, capped at the same
            max width as the preview. */}
        <div
          ref={wrapperRef}
          data-page-surface
          onClick={() => {
            select(null);
          }}
          className='bg-background relative w-full max-w-5xl overflow-auto
            rounded-xl border'
        >
          {/* Content-area boundary: gray lines at the padding inset that mark
              the max width/height where components live. Each line spans the
              full container and they cross at the four corners. */}
          <div
            className='bg-border pointer-events-none absolute inset-y-0 z-0 w-px'
            style={{ left: CONTAINER_PADDING }}
          />
          <div
            className='bg-border pointer-events-none absolute inset-y-0 z-0 w-px'
            style={{ right: CONTAINER_PADDING }}
          />
          <div
            className='bg-border pointer-events-none absolute inset-x-0 z-0 h-px'
            style={{ top: CONTAINER_PADDING }}
          />
          <div
            className='bg-border pointer-events-none absolute inset-x-0 z-0 h-px'
            style={{ bottom: CONTAINER_PADDING }}
          />

          {components.map((component) => (
            <PageCanvasItem
              key={component.id}
              component={component}
              target={target}
            />
          ))}

          {guideX !== null && (
            <div
              className='bg-primary pointer-events-none absolute inset-y-0 z-20
                w-px'
              style={{ left: guideX }}
            />
          )}
          {guideY !== null && (
            <div
              className='bg-primary pointer-events-none absolute inset-x-0 z-20
                h-px'
              style={{ top: guideY }}
            />
          )}

          {components.length === 0 && (
            <div
              className='text-muted-foreground pointer-events-none absolute
                inset-0 flex items-center justify-center text-sm'
            >
              Drag components from the palette to build your page.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
