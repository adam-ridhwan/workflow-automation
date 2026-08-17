import { NODE_DIMENSIONS } from './organize-canvas-layout';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodePositionChange } from '@xyflow/react';

type HelperLines = {
  /** Flow y of a horizontal guide line, when a vertical snap happened. */
  horizontal?: number;
  /** Flow x of a vertical guide line, when a horizontal snap happened. */
  vertical?: number;
  snapPosition: { x?: number; y?: number };
};

const SNAP_DISTANCE = 6;

type Bounds = {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
};

function getBounds(position: { x: number; y: number }, node: Node): Bounds {
  const width = node.measured?.width ?? NODE_DIMENSIONS.WIDTH;
  const height = node.measured?.height ?? NODE_DIMENSIONS.HEIGHT;
  return {
    left: position.x,
    right: position.x + width,
    top: position.y,
    bottom: position.y + height,
    width,
    height,
  };
}

/**
 * Figma-style alignment snapping: compares the dragged node's edges and
 * centers against every other node and, within SNAP_DISTANCE, returns the
 * clamped position plus the guide-line coordinates to draw.
 */
export function getHelperLines(
  change: NodePositionChange,
  nodes: Node<WorkflowNodeData>[],
  distance: number = SNAP_DISTANCE
): HelperLines {
  const result: HelperLines = { snapPosition: {} };
  const nodeA = nodes.find((node) => node.id === change.id);
  if (!nodeA || !change.position) {
    return result;
  }

  const a = getBounds(change.position, nodeA);
  let bestVertical = distance;
  let bestHorizontal = distance;

  for (const nodeB of nodes) {
    if (nodeB.id === nodeA.id) {
      continue;
    }
    const b = getBounds(nodeB.position, nodeB);

    // Vertical guides (snap x).
    const candidatesX: Array<[number, number, number]> = [
      // [distance, snapped x, guide-line x]
      [Math.abs(a.left - b.left), b.left, b.left],
      [Math.abs(a.right - b.right), b.right - a.width, b.right],
      [Math.abs(a.left - b.right), b.right, b.right],
      [Math.abs(a.right - b.left), b.left - a.width, b.left],
      [
        Math.abs(a.left + a.width / 2 - (b.left + b.width / 2)),
        b.left + b.width / 2 - a.width / 2,
        b.left + b.width / 2,
      ],
    ];
    for (const [gap, snapX, lineX] of candidatesX) {
      if (gap < bestVertical) {
        bestVertical = gap;
        result.snapPosition.x = snapX;
        result.vertical = lineX;
      }
    }

    // Horizontal guides (snap y).
    const candidatesY: Array<[number, number, number]> = [
      [Math.abs(a.top - b.top), b.top, b.top],
      [Math.abs(a.bottom - b.bottom), b.bottom - a.height, b.bottom],
      [Math.abs(a.top - b.bottom), b.bottom, b.bottom],
      [Math.abs(a.bottom - b.top), b.top - a.height, b.top],
      [
        Math.abs(a.top + a.height / 2 - (b.top + b.height / 2)),
        b.top + b.height / 2 - a.height / 2,
        b.top + b.height / 2,
      ],
    ];
    for (const [gap, snapY, lineY] of candidatesY) {
      if (gap < bestHorizontal) {
        bestHorizontal = gap;
        result.snapPosition.y = snapY;
        result.horizontal = lineY;
      }
    }
  }

  return result;
}
