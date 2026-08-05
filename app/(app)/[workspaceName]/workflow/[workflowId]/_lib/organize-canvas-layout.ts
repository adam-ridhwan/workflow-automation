import dagre from '@dagrejs/dagre';

import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

/** Matches the rendered WorkflowCanvasNode card (w-64, h-14 header). */
export const NODE_DIMENSIONS = { WIDTH: 256, HEIGHT: 56 };

/** Keeps the organized layout off the canvas origin — X clears the floating
 * node palette (left-4 + w-44 ≈ 192px) at default zoom. */
const LAYOUT_MARGIN = { X: 256, Y: 100 };

/** Vertical gap between stacked nodes in the same rank. */
const NODE_SEPARATION = 48;

/** Matches the canvas snapGrid, so organized nodes land on the dots. */
const GRID = 12;

function snapToGrid(value: number) {
  return Math.round(value / GRID) * GRID;
}

/**
 * Auto layout via dagre (the engine behind React Flow's layouting example):
 * left-to-right ranks matching the nodes' left/right handles. Dagre decides
 * the ranks and ordering; a post-pass then aligns each node's TOP border with
 * its parent's, so a chain runs in a straight line along the tops. Siblings
 * that would collide are pushed down, and everything snaps to the grid.
 */
export function organizeCanvasLayout(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[]
): Node<WorkflowNodeData>[] {
  if (nodes.length === 0) {
    return nodes;
  }

  const graph = new dagre.graphlib.Graph();
  graph.setDefaultEdgeLabel(() => ({}));
  graph.setGraph({ rankdir: 'LR', nodesep: NODE_SEPARATION, ranksep: 80 });

  const heights = new Map(
    nodes.map((node) => [
      node.id,
      node.measured?.height ?? NODE_DIMENSIONS.HEIGHT,
    ])
  );
  for (const node of nodes) {
    graph.setNode(node.id, {
      width: node.measured?.width ?? NODE_DIMENSIONS.WIDTH,
      height: heights.get(node.id),
    });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  const parents = new Map<string, string[]>(nodes.map((node) => [node.id, []]));
  for (const edge of edges) {
    parents.get(edge.target)?.push(edge.source);
  }

  // Group nodes into ranks (same dagre x center) and process left to right.
  const ranks = new Map<number, string[]>();
  for (const node of nodes) {
    const key = Math.round(graph.node(node.id).x);
    ranks.set(key, [...(ranks.get(key) ?? []), node.id]);
  }

  const tops = new Map<string, number>();
  for (const key of [...ranks.keys()].sort((a, b) => a - b)) {
    // Keep dagre's vertical ordering within the rank.
    const ids = [...(ranks.get(key) ?? [])].sort(
      (a, b) => graph.node(a).y - graph.node(b).y
    );
    let previousBottom = Number.NEGATIVE_INFINITY;
    for (const id of ids) {
      const dagreTop = graph.node(id).y - (heights.get(id) ?? 0) / 2;
      const parentTops = (parents.get(id) ?? [])
        .map((parentId) => tops.get(parentId))
        .filter((top) => top !== undefined);
      // Follow the parent's top border; fall back to dagre's placement.
      let top = parentTops.length > 0 ? Math.min(...parentTops) : dagreTop;
      top = Math.max(top, previousBottom + NODE_SEPARATION);
      tops.set(id, top);
      previousBottom = top + (heights.get(id) ?? 0);
    }
  }

  return nodes.map((node) => {
    const placed = graph.node(node.id);
    return {
      ...node,
      position: {
        // Dagre positions node centers; React Flow positions top-left corners.
        x: snapToGrid(
          LAYOUT_MARGIN.X +
            placed.x -
            (node.measured?.width ?? NODE_DIMENSIONS.WIDTH) / 2
        ),
        y: snapToGrid(LAYOUT_MARGIN.Y + (tops.get(node.id) ?? 0)),
      },
    };
  });
}
