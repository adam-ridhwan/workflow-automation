import { MIN_COMPONENT_H, MIN_COMPONENT_W } from '../_constants/page-component-meta';

export type Rect = {
  x: number;
  y: number;
  w: number;
  h: number;
  /** Snap to this rect but draw no guide line (used for the container edge, so
   * it doesn't duplicate the visible border). */
  silent?: boolean;
};

export type SnapResult = {
  x: number;
  y: number;
  /** Content-x of the vertical guide line to draw, or null when no x snap. */
  guideX: number | null;
  /** Content-y of the horizontal guide line to draw, or null when no y snap. */
  guideY: number | null;
};

export type ResizeSnapResult = {
  x: number;
  y: number;
  w: number;
  h: number;
  guideX: number | null;
  guideY: number | null;
};

/** Which edges of a component are moving during a corner resize. */
export type ResizeEdges = {
  left?: boolean;
  right?: boolean;
  top?: boolean;
  bottom?: boolean;
};

/** How close (px) an edge/center must be to snap. */
export const SNAP_DISTANCE = 6;

/**
 * Figma-style alignment snapping for a dragged component: compares the active
 * rect's left/right/center-x against every other component (and likewise for
 * y), and within SNAP_DISTANCE returns the snapped position plus the guide
 * lines to draw. x and y snap independently.
 */
export function snapToComponents(
  active: Rect,
  others: Rect[],
  distance: number = SNAP_DISTANCE
): SnapResult {
  const result: SnapResult = {
    x: active.x,
    y: active.y,
    guideX: null,
    guideY: null,
  };
  let bestV = distance;
  let bestH = distance;

  const aL = active.x;
  const aR = active.x + active.w;
  const aCx = active.x + active.w / 2;
  const aT = active.y;
  const aB = active.y + active.h;
  const aCy = active.y + active.h / 2;

  for (const b of others) {
    const bL = b.x;
    const bR = b.x + b.w;
    const bCx = b.x + b.w / 2;
    const bT = b.y;
    const bB = b.y + b.h;
    const bCy = b.y + b.h / 2;

    // Vertical guides (snap x): [gap, snapped x, guide-line x]
    const candidatesX: Array<[number, number, number]> = [
      [Math.abs(aL - bL), bL, bL],
      [Math.abs(aR - bR), bR - active.w, bR],
      [Math.abs(aL - bR), bR, bR],
      [Math.abs(aR - bL), bL - active.w, bL],
      [Math.abs(aCx - bCx), bCx - active.w / 2, bCx],
    ];
    for (const [gap, snapX, lineX] of candidatesX) {
      if (gap < bestV) {
        bestV = gap;
        result.x = snapX;
        result.guideX = b.silent ? null : lineX;
      }
    }

    // Horizontal guides (snap y): [gap, snapped y, guide-line y]
    const candidatesY: Array<[number, number, number]> = [
      [Math.abs(aT - bT), bT, bT],
      [Math.abs(aB - bB), bB - active.h, bB],
      [Math.abs(aT - bB), bB, bB],
      [Math.abs(aB - bT), bT - active.h, bT],
      [Math.abs(aCy - bCy), bCy - active.h / 2, bCy],
    ];
    for (const [gap, snapY, lineY] of candidatesY) {
      if (gap < bestH) {
        bestH = gap;
        result.y = snapY;
        result.guideY = b.silent ? null : lineY;
      }
    }
  }

  return result;
}

/**
 * Alignment snapping while resizing from any corner: snaps whichever edges are
 * moving (per `edges`) to other components' / the container's edges and centers,
 * keeping the opposite corner anchored. Silent rects snap without a guide line.
 */
export function snapResizeBox(
  box: Rect,
  others: Rect[],
  edges: ResizeEdges,
  distance: number = SNAP_DISTANCE
): ResizeSnapResult {
  let x = box.x;
  let y = box.y;
  let w = box.w;
  let h = box.h;
  let guideX: number | null = null;
  let guideY: number | null = null;
  let bestV = distance;
  let bestH = distance;

  for (const b of others) {
    const xs = [b.x, b.x + b.w, b.x + b.w / 2];
    const ys = [b.y, b.y + b.h, b.y + b.h / 2];

    if (edges.right) {
      for (const lineX of xs) {
        const gap = Math.abs(x + w - lineX);
        if (gap < bestV) {
          bestV = gap;
          w = Math.max(MIN_COMPONENT_W, lineX - x);
          guideX = b.silent ? null : lineX;
        }
      }
    }
    if (edges.left) {
      for (const lineX of xs) {
        const gap = Math.abs(x - lineX);
        if (gap < bestV) {
          bestV = gap;
          const rightEdge = x + w;
          w = Math.max(MIN_COMPONENT_W, rightEdge - lineX);
          x = rightEdge - w;
          guideX = b.silent ? null : lineX;
        }
      }
    }
    if (edges.bottom) {
      for (const lineY of ys) {
        const gap = Math.abs(y + h - lineY);
        if (gap < bestH) {
          bestH = gap;
          h = Math.max(MIN_COMPONENT_H, lineY - y);
          guideY = b.silent ? null : lineY;
        }
      }
    }
    if (edges.top) {
      for (const lineY of ys) {
        const gap = Math.abs(y - lineY);
        if (gap < bestH) {
          bestH = gap;
          const bottomEdge = y + h;
          h = Math.max(MIN_COMPONENT_H, bottomEdge - lineY);
          y = bottomEdge - h;
          guideY = b.silent ? null : lineY;
        }
      }
    }
  }

  return { x, y, w, h, guideX, guideY };
}
