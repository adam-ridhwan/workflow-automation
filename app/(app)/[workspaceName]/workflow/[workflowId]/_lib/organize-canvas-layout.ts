import dagre from '@dagrejs/dagre';

import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

/** Matches the rendered WorkflowNode card (w-48 h-12). */
export const NODE_DIMENSIONS = { WIDTH: 192, HEIGHT: 48 };

/** Keeps the organized layout off the canvas origin. */
const LAYOUT_MARGIN = { X: 100, Y: 100 };

/**
 * Auto layout via dagre (the engine behind React Flow's layouting example):
 * left-to-right ranks matching the nodes' left/right handles.
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
  graph.setGraph({ rankdir: 'LR', nodesep: 48, ranksep: 80 });

  for (const node of nodes) {
    graph.setNode(node.id, {
      width: node.measured?.width ?? NODE_DIMENSIONS.WIDTH,
      height: node.measured?.height ?? NODE_DIMENSIONS.HEIGHT,
    });
  }
  for (const edge of edges) {
    graph.setEdge(edge.source, edge.target);
  }

  dagre.layout(graph);

  return nodes.map((node) => {
    // Dagre positions node centers; React Flow positions top-left corners.
    const placed = graph.node(node.id);
    return {
      ...node,
      position: {
        x:
          LAYOUT_MARGIN.X +
          placed.x -
          (node.measured?.width ?? NODE_DIMENSIONS.WIDTH) / 2,
        y:
          LAYOUT_MARGIN.Y +
          placed.y -
          (node.measured?.height ?? NODE_DIMENSIONS.HEIGHT) / 2,
      },
    };
  });
}
