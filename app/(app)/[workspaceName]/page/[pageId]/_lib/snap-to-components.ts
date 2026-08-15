import { MIN_COMPONENT_H, MIN_COMPONENT_W } from '../_constants/page-component-meta';

export type Rect = { x: number; y: number; w: number; h: number };

export type SnapResult = {
  x: number;
  y: number;
  /** Content-x of the vertical guide line to draw, or null when no x snap. */
  guideX: number | null;
  /** Content-y of the horizontal guide line to draw, or null when no y snap. */
  guideY: number | null;
};

export type ResizeSnapResult = {
  w: number;
  h: number;
  guideX: number | null;
  guideY: number | null;
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
        result.guideX = lineX;
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
        result.guideY = lineY;
      }
    }
  }

  return result;
}

/**
 * Alignment snapping while resizing from the bottom-right corner: snaps the
 * moving right edge to other components' left/right/center-x and the moving
 * bottom edge to their top/bottom/center-y. The top-left stays fixed.
 */
export function snapResize(
  rect: Rect,
  others: Rect[],
  distance: number = SNAP_DISTANCE
): ResizeSnapResult {
  const result: ResizeSnapResult = {
    w: rect.w,
    h: rect.h,
    guideX: null,
    guideY: null,
  };
  let bestV = distance;
  let bestH = distance;

  const right = rect.x + rect.w;
  const bottom = rect.y + rect.h;

  for (const b of others) {
    for (const lineX of [b.x, b.x + b.w, b.x + b.w / 2]) {
      const gap = Math.abs(right - lineX);
      if (gap < bestV) {
        bestV = gap;
        result.w = Math.max(MIN_COMPONENT_W, lineX - rect.x);
        result.guideX = lineX;
      }
    }
    for (const lineY of [b.y, b.y + b.h, b.y + b.h / 2]) {
      const gap = Math.abs(bottom - lineY);
      if (gap < bestH) {
        bestH = gap;
        result.h = Math.max(MIN_COMPONENT_H, lineY - rect.y);
        result.guideY = lineY;
      }
    }
  }

  return result;
}
