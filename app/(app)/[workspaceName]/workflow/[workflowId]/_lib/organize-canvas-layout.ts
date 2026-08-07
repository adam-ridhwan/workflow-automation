import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

/** Matches the rendered WorkflowCanvasNode card (w-64, h-14 header). */
export const NODE_DIMENSIONS = { WIDTH: 256, HEIGHT: 56 };

/** Keeps the organized layout off the canvas origin — X clears the floating
 * node palette (left-4 + w-44 ≈ 192px) at default zoom. */
const LAYOUT_MARGIN = { X: 256, Y: 100 };

/** Gap between execution ranks (columns) and between nodes within a rank. */
const RANK_SEP = 120;
const NODE_SEP = 96;

/** Matches the canvas snapGrid, so organized nodes land on the dots. */
const GRID = 12;

function snapToGrid(value: number) {
  return Math.round(value / GRID) * GRID;
}

function nodeHeight(node: Node<WorkflowNodeData>) {
  return node.measured?.height ?? NODE_DIMENSIONS.HEIGHT;
}

/**
 * Auto layout in the canvas's execution order: nodes are ranked into
 * left-to-right columns by the same Kahn's-algorithm topological sort
 * `executeCanvas` uses to run the graph. A node's column reflects when it runs
 * (rank = longest path from a root) and its row follows the order the executor
 * would dequeue it, so the layout reads in execution order.
 */
export function organizeCanvasLayout(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[]
): Node<WorkflowNodeData>[] {
  if (nodes.length === 0) {
    return nodes;
  }

  // Mirror executeCanvas: build child adjacency + in-degrees from the edges.
  const children = new Map<string, string[]>(
    nodes.map((node) => [node.id, []])
  );
  const indegree = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  for (const edge of edges) {
    children.get(edge.source)?.push(edge.target);
    indegree.set(edge.target, (indegree.get(edge.target) ?? 0) + 1);
  }

  // Kahn's algorithm (FIFO queue seeded from the roots), matching the executor.
  // `depth` tracks the longest path from a root so a node sits one column right
  // of its latest-scheduled parent.
  const byId = new Map(nodes.map((node) => [node.id, node]));
  const queue = nodes.filter((node) => indegree.get(node.id) === 0);
  const depth = new Map<string, number>(nodes.map((node) => [node.id, 0]));
  const order: string[] = [];
  while (queue.length > 0) {
    const node = queue.shift();
    if (!node) {
      break;
    }
    order.push(node.id);
    for (const childId of children.get(node.id) ?? []) {
      depth.set(
        childId,
        Math.max(depth.get(childId) ?? 0, (depth.get(node.id) ?? 0) + 1)
      );
      const remaining = (indegree.get(childId) ?? 0) - 1;
      indegree.set(childId, remaining);
      const child = byId.get(childId);
      if (remaining === 0 && child) {
        queue.push(child);
      }
    }
  }

  // Nodes on a cycle never reach the queue (executeCanvas skips them too);
  // stack them in a trailing column so the layout still places every node.
  const resolved = new Set(order);
  const leftoverRank = Math.max(0, ...depth.values()) + 1;
  for (const node of nodes) {
    if (!resolved.has(node.id)) {
      depth.set(node.id, leftoverRank);
      order.push(node.id);
    }
  }

  // Bucket node ids by rank, preserving the dequeue order within each rank.
  const columns = new Map<number, string[]>();
  for (const id of order) {
    const rank = depth.get(id) ?? 0;
    (columns.get(rank) ?? columns.set(rank, []).get(rank)!).push(id);
  }

  // Vertically center each column against the tallest one.
  const columnHeights = new Map<number, number>();
  let maxColumnHeight = 0;
  for (const [rank, ids] of columns) {
    const height =
      ids.reduce((sum, id) => sum + nodeHeight(byId.get(id)!), 0) +
      Math.max(0, ids.length - 1) * NODE_SEP;
    columnHeights.set(rank, height);
    maxColumnHeight = Math.max(maxColumnHeight, height);
  }

  const positions = new Map<string, { x: number; y: number }>();
  for (const [rank, ids] of columns) {
    const x = LAYOUT_MARGIN.X + rank * (NODE_DIMENSIONS.WIDTH + RANK_SEP);
    let y =
      LAYOUT_MARGIN.Y + (maxColumnHeight - (columnHeights.get(rank) ?? 0)) / 2;
    for (const id of ids) {
      positions.set(id, { x: snapToGrid(x), y: snapToGrid(y) });
      y += nodeHeight(byId.get(id)!) + NODE_SEP;
    }
  }

  return nodes.map((node) => ({
    ...node,
    position: positions.get(node.id) ?? node.position,
  }));
}
