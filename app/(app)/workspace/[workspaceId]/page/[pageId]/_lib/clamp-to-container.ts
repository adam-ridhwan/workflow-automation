import {
  CONTAINER_PADDING,
  MIN_COMPONENT_H,
  MIN_COMPONENT_W,
} from '../_constants/page-component-meta';

import type { ResizeEdges } from './snap-to-components';

/**
 * Clamp a component's top-left so the whole component stays inside the
 * container's padding boundary (the gray content-area outline). Components
 * wider/taller than the available area are pinned to the top-left inset.
 */
export function clampToContainer(
  pos: { x: number; y: number },
  size: { w: number; h: number },
  container: { w: number; h: number }
): { x: number; y: number } {
  const maxX = Math.max(
    CONTAINER_PADDING,
    container.w - CONTAINER_PADDING - size.w
  );
  const maxY = Math.max(
    CONTAINER_PADDING,
    container.h - CONTAINER_PADDING - size.h
  );
  return {
    x: Math.min(Math.max(pos.x, CONTAINER_PADDING), maxX),
    y: Math.min(Math.max(pos.y, CONTAINER_PADDING), maxY),
  };
}

/**
 * Clamp a resize box so the moving edges (per `edges`) stay within the
 * container's padding boundary, keeping the anchored (opposite) corner fixed.
 * Minimum component size still wins over the boundary.
 */
export function clampResizeBox(
  box: { x: number; y: number; w: number; h: number },
  edges: ResizeEdges,
  container: { w: number; h: number }
): { x: number; y: number; w: number; h: number } {
  let { x, y, w, h } = box;
  const maxRight = container.w - CONTAINER_PADDING;
  const maxBottom = container.h - CONTAINER_PADDING;

  if (edges.left && x < CONTAINER_PADDING) {
    const right = x + w;
    x = CONTAINER_PADDING;
    w = Math.max(MIN_COMPONENT_W, right - x);
  }
  if (edges.right && x + w > maxRight) {
    w = Math.max(MIN_COMPONENT_W, maxRight - x);
  }
  if (edges.top && y < CONTAINER_PADDING) {
    const bottom = y + h;
    y = CONTAINER_PADDING;
    h = Math.max(MIN_COMPONENT_H, bottom - y);
  }
  if (edges.bottom && y + h > maxBottom) {
    h = Math.max(MIN_COMPONENT_H, maxBottom - y);
  }

  return { x, y, w, h };
}
