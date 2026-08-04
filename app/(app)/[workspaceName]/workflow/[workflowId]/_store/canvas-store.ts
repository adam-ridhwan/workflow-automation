'use client';

import { convex } from '@/components/convev-client-provider';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import { toCanvasData, WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { organizeCanvasLayout } from '../_lib/organize-canvas-layout';

import type { Id } from '@/convex/_generated/dataModel';
import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type {
  Connection,
  Edge,
  EdgeChange,
  Node,
  NodeChange,
} from '@xyflow/react';

/** Where saves go; comes from the page since the store lives outside React
 * and can't read the URL. */
type SaveTarget = {
  workspaceName: string;
  workflowId: Id<'workflows'>;
};

interface CanvasState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  version: number;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection, target: SaveTarget) => void;
  saveWorkflow: (target: SaveTarget) => void;
  addNode: (
    target: SaveTarget,
    uid: string,
    label: string,
    position: { x: number; y: number }
  ) => void;
  organizeNodes: (target: SaveTarget) => void;
  setNodeArgument: (nodeId: string, name: string, value: unknown) => void;
  setNodes: (nodes: Node<WorkflowNodeData>[]) => void;
  setEdges: (edges: Edge<WorkflowEdgeData>[]) => void;
  setCanvas: (
    nodes: Node<WorkflowNodeData>[],
    edges: Edge<WorkflowEdgeData>[],
    version: number
  ) => void;
}

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  version: 1,
  onNodesChange: (changes) => {
    const updated = applyNodeChanges(changes, get().nodes);
    set({ nodes: updated as Node<WorkflowNodeData>[] });
  },
  onEdgesChange: (changes) => {
    const updated = applyEdgeChanges(changes, get().edges);
    set({ edges: updated as Edge<WorkflowEdgeData>[] });
  },
  onConnect: (connection, target) => {
    const edge: Edge<WorkflowEdgeData> = {
      ...connection,
      id: crypto.randomUUID(),
      type: WORKFLOW_EDGE,
      data: {
        source: connection.source,
        target: connection.target,
        arguments: {},
      },
    };
    set({ edges: addEdge(edge, get().edges) });
    get().saveWorkflow(target);
  },
  saveWorkflow: (target) => {
    const { nodes, edges, version } = get();
    convex
      .mutation(api.workflows.updateCanvas, {
        workspaceName: target.workspaceName,
        workflowId: target.workflowId,
        canvas: toCanvasData(nodes, edges, version),
      })
      .catch(() => {
        toast.add({
          type: 'error',
          title: 'Could not save the canvas. Please try again.',
        });
      });
  },
  addNode: (target, uid, label, position) => {
    const node_id = crypto.randomUUID();
    const newNode = {
      id: node_id,
      type: WORKFLOW_NODE,
      position,
      data: {
        node_id,
        node_uid: uid,
        name: label,
        arguments: {},
        parents: [],
        children: [],
      },
    } satisfies Node<WorkflowNodeData>;
    set({ nodes: [...get().nodes, newNode] });
    get().saveWorkflow(target);
  },
  organizeNodes: (target) => {
    const { nodes, edges } = get();
    set({ nodes: organizeCanvasLayout(nodes, edges) });
    get().saveWorkflow(target);
  },
  setNodeArgument: (nodeId, name, value) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? {
              ...node,
              data: {
                ...node.data,
                arguments: { ...node.data.arguments, [name]: value },
              },
            }
          : node
      ),
    });
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCanvas: (nodes, edges, version) => set({ nodes, edges, version }),
}));
