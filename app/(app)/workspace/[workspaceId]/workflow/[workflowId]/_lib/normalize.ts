import type {
  WorkflowCanvasData,
  WorkflowEdgeData,
  WorkflowNodeData,
} from '@/convex/canvas';
import type { Edge, Node } from '@xyflow/react';

export const WORKFLOW_NODE = 'workflow-node';
export const WORKFLOW_EDGE = 'workflow-edge';

/** Map the stored canvas to React Flow nodes. */
export function toFlowNodes(
  canvas: WorkflowCanvasData
): Node<WorkflowNodeData>[] {
  return Object.values(canvas.nodes).map((node) => ({
    id: node.node_id,
    type: WORKFLOW_NODE,
    position: node.position ?? { x: 0, y: 0 },
    data: {
      node_id: node.node_id,
      node_uid: node.node_uid,
      name: node.name,
      arguments: node.arguments,
      parents: node.parents,
      children: node.children,
      annotation: node.annotation,
    },
  }));
}

/** Map the stored canvas to React Flow edges. */
export function toFlowEdges(
  canvas: WorkflowCanvasData
): Edge<WorkflowEdgeData>[] {
  return canvas.edges.map((edge) => ({
    // The handle is part of the id so two edges leaving different ports of the
    // same node to the same target don't collide.
    id: `${edge.source}:${edge.sourceHandle ?? ''}->${edge.target}`,
    type: WORKFLOW_EDGE,
    source: edge.source,
    target: edge.target,
    sourceHandle: edge.sourceHandle,
    data: {
      source: edge.source,
      target: edge.target,
      sourceHandle: edge.sourceHandle,
      arguments: edge.arguments,
    },
  }));
}

/** Map React Flow state back to the stored canvas shape. */
export function toCanvasData(
  nodes: Node<WorkflowNodeData>[],
  edges: Edge<WorkflowEdgeData>[],
  version: number
): WorkflowCanvasData {
  return {
    nodes: Object.fromEntries(
      nodes.map((node) => [
        node.data.node_id,
        { ...node.data, position: node.position },
      ])
    ),
    edges: edges.map(
      (edge) =>
        edge.data ?? {
          source: edge.source,
          target: edge.target,
          sourceHandle: edge.sourceHandle ?? undefined,
          arguments: {},
        }
    ),
    version,
  };
}
