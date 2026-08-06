'use client';

import { convex } from '@/components/convev-client-provider';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import { getHelperLines } from '../_lib/get-helper-lines';
import { toCanvasData, WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { organizeCanvasLayout } from '../_lib/organize-canvas-layout';

import type { Id } from '@/convex/_generated/dataModel';
import type {
  WorkflowAnnotation,
  WorkflowEdgeData,
  WorkflowNodeData,
} from '@/convex/canvas';
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
  isRunning: boolean;
  isStopping: boolean;
  helperLineHorizontal: number | undefined;
  helperLineVertical: number | undefined;
  runWorkflow: (
    target: SaveTarget,
    fromRunHistoryId?: Id<'runHistory'>
  ) => Promise<Id<'runHistory'> | undefined>;
  stopWorkflow: (target: SaveTarget) => Promise<void>;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection, target: SaveTarget) => void;
  deleteEdge: (target: SaveTarget, edgeId: string) => void;
  saveWorkflow: (target: SaveTarget) => void;
  addNode: (
    target: SaveTarget,
    uid: string,
    label: string,
    position: { x: number; y: number }
  ) => void;
  organizeNodes: (target: SaveTarget) => void;
  setNodeArgument: (nodeId: string, name: string, value: unknown) => void;
  setNodeAnnotation: (
    nodeId: string,
    annotation: WorkflowAnnotation | undefined
  ) => void;
  cloneNode: (target: SaveTarget, nodeId: string) => void;
  deleteNode: (target: SaveTarget, nodeId: string) => void;
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
  isRunning: false,
  isStopping: false,
  runWorkflow: async (target, fromRunHistoryId) => {
    if (get().isRunning) {
      return undefined;
    }
    set({ isRunning: true, isStopping: false });
    try {
      if (fromRunHistoryId !== undefined) {
        // Re-run in the background; returns the new run id immediately so the
        // caller can navigate to it while it executes.
        return await convex.mutation(api.runHistory.startRerun, {
          workspaceName: target.workspaceName,
          workflowId: target.workflowId,
          fromRunHistoryId,
        });
      }
      const runHistoryId = await convex.action(api.runWorkflow.run, {
        workspaceName: target.workspaceName,
        workflowId: target.workflowId,
      });
      // A stopped run returns normally too — don't claim success.
      if (get().isStopping) {
        toast.add({ type: 'info', title: 'Workflow stopped.' });
      } else {
        toast.add({ type: 'success', title: 'Workflow ran successfully.' });
      }
      return runHistoryId;
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof Error ? error.message : 'The workflow run failed.',
      });
      return undefined;
    } finally {
      set({ isRunning: false, isStopping: false });
    }
  },
  stopWorkflow: async (target) => {
    // Stays true until the run actually finishes (runWorkflow's finally).
    set({ isStopping: true });
    try {
      await convex.mutation(api.runHistory.stopRun, {
        workspaceName: target.workspaceName,
        workflowId: target.workflowId,
      });
    } catch {
      set({ isStopping: false });
      toast.add({ type: 'error', title: 'Could not stop the run.' });
    }
  },
  helperLineHorizontal: undefined,
  helperLineVertical: undefined,
  onNodesChange: (changes) => {
    let helperLineHorizontal: number | undefined;
    let helperLineVertical: number | undefined;

    // Alignment snapping only applies to a plain single-node drag.
    const [change] = changes;
    if (
      changes.length === 1 &&
      change.type === 'position' &&
      change.dragging &&
      change.position
    ) {
      const helperLines = getHelperLines(change, get().nodes);
      change.position.x = helperLines.snapPosition.x ?? change.position.x;
      change.position.y = helperLines.snapPosition.y ?? change.position.y;
      helperLineHorizontal = helperLines.horizontal;
      helperLineVertical = helperLines.vertical;
    }

    const updated = applyNodeChanges(changes, get().nodes);
    set({
      nodes: updated as Node<WorkflowNodeData>[],
      helperLineHorizontal,
      helperLineVertical,
    });
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
  deleteEdge: (target, edgeId) => {
    set({ edges: get().edges.filter((edge) => edge.id !== edgeId) });
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
  setNodeAnnotation: (nodeId, annotation) => {
    set({
      nodes: get().nodes.map((node) =>
        node.id === nodeId
          ? { ...node, data: { ...node.data, annotation } }
          : node
      ),
    });
  },
  cloneNode: (target, nodeId) => {
    const source = get().nodes.find((node) => node.id === nodeId);
    if (!source) {
      return;
    }
    const node_id = crypto.randomUUID();
    const clone: Node<WorkflowNodeData> = {
      id: node_id,
      type: WORKFLOW_NODE,
      position: { x: source.position.x + 32, y: source.position.y + 32 },
      selected: true,
      data: {
        ...source.data,
        node_id,
        arguments: { ...source.data.arguments },
        parents: [],
        children: [],
      },
    };
    set({
      nodes: [
        ...get().nodes.map((node) => ({ ...node, selected: false })),
        clone,
      ],
    });
    get().saveWorkflow(target);
  },
  deleteNode: (target, nodeId) => {
    set({
      nodes: get().nodes.filter((node) => node.id !== nodeId),
      edges: get().edges.filter(
        (edge) => edge.source !== nodeId && edge.target !== nodeId
      ),
    });
    get().saveWorkflow(target);
  },
  setNodes: (nodes) => set({ nodes }),
  setEdges: (edges) => set({ edges }),
  setCanvas: (nodes, edges, version) => set({ nodes, edges, version }),
}));
