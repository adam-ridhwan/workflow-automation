'use client';

import { convex } from '@/components/convev-client-provider';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { addEdge, applyEdgeChanges, applyNodeChanges } from '@xyflow/react';
import { create } from 'zustand';

import { CanvasHistoryService } from '../_lib/canvas-history';
import { getHelperLines } from '../_lib/get-helper-lines';
import { toCanvasData, WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { organizeCanvasLayout } from '../_lib/organize-canvas-layout';
import { canConnect } from '../_lib/validate-workflow';

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
  workspaceId: Id<'workspaces'>;
  workflowId: Id<'workflows'>;
};

interface CanvasState {
  nodes: Node<WorkflowNodeData>[];
  edges: Edge<WorkflowEdgeData>[];
  version: number;
  /** The single source of truth for run/edit gating. Anything other than
   * 'idle' means the workflow is busy, so edits and the run button lock:
   * 'local' — this client started the run (the only phase that can be stopped);
   * 'scheduled' — queued as a later step of another workflow's chain;
   * 'running' — executing as a chain step (not started from this client);
   * 'idle' — not running. */
  runPhase: 'idle' | 'local' | 'scheduled' | 'running';
  isStopping: boolean;
  canUndo: boolean;
  canRedo: boolean;
  saveStatus: 'saved' | 'saving' | 'error';
  /** A node to visually highlight on the canvas — e.g. while hovering its chip
   * in the LLM prompt's "insert input" menu. */
  highlightedNodeId: string | null;
  helperLineHorizontal: number | undefined;
  helperLineVertical: number | undefined;
  undo: (target: SaveTarget) => void;
  redo: (target: SaveTarget) => void;
  runWorkflow: (
    target: SaveTarget,
    fromRunHistoryId?: Id<'runHistory'>,
    /** Injected into WEBHOOK nodes, for the "send test event" action. */
    webhookPayload?: string
  ) => Promise<Id<'runHistory'> | undefined>;
  stopWorkflow: (target: SaveTarget) => Promise<void>;
  /** Reflects the live run doc's phase into the store, so the run button and
   * edits disable for a run this client didn't start (a chain step). Ignored
   * while a local run owns the phase. */
  setRemotePhase: (phase: 'idle' | 'scheduled' | 'running') => void;
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
  selectNode: (nodeId: string) => void;
  setHighlightedNodeId: (nodeId: string | null) => void;
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

/** Undo/redo history, shared with the store. Lives outside React so a snapshot
 * is recorded on every save (see `saveWorkflow`). */
const history = new CanvasHistoryService();

/** True only while `undo`/`redo` restores a snapshot, so the save it triggers
 * isn't recorded back into history as a fresh entry. */
let isRestoring = false;

/** Number of canvas saves currently in flight, so `saveStatus` only flips back
 * to 'saved' once every pending write has settled. */
let pendingSaves = 0;

/** When the current run of saves started, and the minimum time to keep the
 * "Saving…" badge up — the writes are near-instant, so without a floor the
 * indicator just flashes. The real save is never slowed, only the badge. */
let savingSince = 0;
const MIN_SAVING_MS = 300;

export const useCanvasStore = create<CanvasState>((set, get) => ({
  nodes: [],
  edges: [],
  version: 1,
  runPhase: 'idle',
  isStopping: false,
  canUndo: false,
  canRedo: false,
  saveStatus: 'saved',
  highlightedNodeId: null,
  undo: (target) => {
    const snapshot = history.undo();
    if (snapshot === undefined) {
      return;
    }
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
    isRestoring = true;
    get().saveWorkflow(target);
    isRestoring = false;
  },
  redo: (target) => {
    const snapshot = history.redo();
    if (snapshot === undefined) {
      return;
    }
    set({
      nodes: snapshot.nodes,
      edges: snapshot.edges,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
    isRestoring = true;
    get().saveWorkflow(target);
    isRestoring = false;
  },
  runWorkflow: async (target, fromRunHistoryId, webhookPayload) => {
    if (get().runPhase !== 'idle') {
      return undefined;
    }
    set({ runPhase: 'local', isStopping: false });
    try {
      if (fromRunHistoryId !== undefined) {
        // Re-run in the background; returns the new run id immediately so the
        // caller can navigate to it while it executes.
        return await convex.mutation(api.runHistory.startRerun, {
          workspaceId: target.workspaceId,
          workflowId: target.workflowId,
          fromRunHistoryId,
        });
      }
      const runHistoryId = await convex.action(api.runWorkflow.run, {
        workspaceId: target.workspaceId,
        workflowId: target.workflowId,
        webhookPayload,
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
        title: errorMessage(error, 'The workflow run failed.'),
      });
      return undefined;
    } finally {
      // The local run is over. The canvas effect re-applies any remaining
      // remote phase from the run doc (which, for a self-run, is 'idle').
      set({ runPhase: 'idle', isStopping: false });
    }
  },
  setRemotePhase: (phase) => {
    // A local run owns the phase until it finishes — never let the run doc
    // override it (that would drop the Stop affordance mid-run).
    if (get().runPhase === 'local') {
      return;
    }
    set({ runPhase: phase });
  },
  stopWorkflow: async (target) => {
    // Stays true until the run actually finishes (runWorkflow's finally).
    set({ isStopping: true });
    try {
      await convex.mutation(api.runHistory.stopRun, {
        workspaceId: target.workspaceId,
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
    // Defense in depth: the canvas already gates this via isValidConnection,
    // but never persist an edge that violates the node specs.
    if (!canConnect(get().nodes, get().edges, connection)) {
      return;
    }
    const edge: Edge<WorkflowEdgeData> = {
      ...connection,
      id: crypto.randomUUID(),
      type: WORKFLOW_EDGE,
      data: {
        source: connection.source,
        target: connection.target,
        sourceHandle: connection.sourceHandle ?? undefined,
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
    // Capture the state being saved into history before hitting the API —
    // unless this save is itself an undo/redo restoring a past snapshot.
    if (!isRestoring) {
      history.record({ nodes, edges });
      set({ canUndo: history.canUndo(), canRedo: history.canRedo() });
    }
    if (pendingSaves === 0) {
      savingSince = Date.now();
    }
    pendingSaves += 1;
    set({ saveStatus: 'saving' });
    convex
      .mutation(api.workflows.updateCanvas, {
        workspaceId: target.workspaceId,
        workflowId: target.workflowId,
        canvas: toCanvasData(nodes, edges, version),
      })
      .then(() => {
        pendingSaves -= 1;
        // Only the last write to settle clears the indicator, so it doesn't
        // flicker to 'saved' while other edits are still saving. Hold it up
        // for at least MIN_SAVING_MS so a near-instant save doesn't flash.
        if (pendingSaves === 0) {
          const remaining = MIN_SAVING_MS - (Date.now() - savingSince);
          if (remaining <= 0) {
            set({ saveStatus: 'saved' });
          } else {
            setTimeout(() => {
              if (pendingSaves === 0) {
                set({ saveStatus: 'saved' });
              }
            }, remaining);
          }
        }
      })
      .catch(() => {
        pendingSaves -= 1;
        set({ saveStatus: 'error' });
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
  selectNode: (nodeId) => {
    set({
      nodes: get().nodes.map((node) => ({
        ...node,
        selected: node.id === nodeId,
      })),
    });
  },
  setHighlightedNodeId: (nodeId) => {
    set({ highlightedNodeId: nodeId });
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
  setCanvas: (nodes, edges, version) => {
    // A fresh load is the history baseline — nothing to undo back past it.
    history.reset({ nodes, edges });
    set({
      nodes,
      edges,
      version,
      canUndo: history.canUndo(),
      canRedo: history.canRedo(),
    });
  },
}));
