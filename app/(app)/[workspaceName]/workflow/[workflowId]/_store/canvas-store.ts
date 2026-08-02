'use client';

import { convex } from '@/components/convev-client-provider';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import { toCanvasData, WORKFLOW_EDGE } from '../_lib/normalize';

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
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCanvas: (nodes, edges, version) => set({ nodes, edges, version }),
}));
