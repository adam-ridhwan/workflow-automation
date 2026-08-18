'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { findNodeSpec } from '@/lib/node-specs';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';

import { useAutoVersion } from '../../_hooks/use-auto-version';
import { useWorkflowRun } from '../../_hooks/use-workflow-run';
import { WORKFLOW_EDGE, WORKFLOW_NODE } from '../../_lib/normalize';
import { NODE_DIMENSIONS } from '../../_lib/organize-canvas-layout';
import { canConnect } from '../../_lib/validate-workflow';
import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { CanvasPalette } from '../canvas-palette/canvas-palette';
import { NodeDragPreview } from '../node-palette/node-drag-preview';
import { NodePalette } from '../node-palette/node-palette';
import { CanvasModeContext } from './canvas-mode-context';
import { NodePanel } from './node-panel';
import { WorkflowCanvasEdge } from './workflow-canvas-edge';
import { WorkflowCanvasHelperLines } from './workflow-canvas-helper-lines';
import { WorkflowCanvasNode } from './workflow-canvas-node';
import { WorkflowCanvasProvider } from './workflow-canvas-provider';

import type { PaletteDragData } from '../node-palette/node-drag-preview';
import type {
  WorkflowCanvasData,
  WorkflowEdgeData,
  WorkflowNodeData,
} from '@/convex/canvas';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import type { Connection, Edge, Node, ReactFlowInstance } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const nodeTypes = { [WORKFLOW_NODE]: WorkflowCanvasNode };
const edgeTypes = { [WORKFLOW_EDGE]: WorkflowCanvasEdge };

type WorkflowCanvasProps = {
  canvas: WorkflowCanvasData;
};

export function WorkflowCanvas({ canvas }: WorkflowCanvasProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<
    Node<WorkflowNodeData>,
    Edge<WorkflowEdgeData>
  > | null>(null);
  const [dragItem, setDragItem] = useState<PaletteDragData | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  useAutoVersion();

  const run = useWorkflowRun();
  // Reflect a run started from elsewhere (a chain step this workflow is part of)
  // into the store, so the run button and argument fields disable even though
  // this client didn't press Run: 'scheduled' while queued, 'running' while
  // executing. The run doc's `phase` holds one stable value for the whole run,
  // so the button doesn't flicker between per-node status updates.
  // `setRemotePhase` ignores this while a local run owns the phase.
  const setRemotePhase = useCanvasStore((s) => s.setRemotePhase);
  const remotePhase = run?.phase ?? 'idle';
  useEffect(() => {
    setRemotePhase(remotePhase);
    return () => {
      setRemotePhase('idle');
    };
  }, [remotePhase, setRemotePhase]);
  // Only fit on load when the workflow already has nodes. On an empty canvas
  // React Flow would keep the fit pending and then fire it when the first node
  // is dropped, yanking the viewport — so leave it off there.
  const fitViewOnLoad = Object.keys(canvas.nodes).length > 0;
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  // The side panels open for a single selected node.
  const selectedNodes = nodes.filter((node) => node.selected);
  const selectedNode = selectedNodes.length === 1 ? selectedNodes[0] : null;

  // When a run starts, open the output node's panel by selecting it, so its
  // result — and the loading state below — is visible without hunting for it.
  const runPhase = useCanvasStore((s) => s.runPhase);
  const selectNode = useCanvasStore((s) => s.selectNode);
  const isRunning = runPhase === 'local' || runPhase === 'running';
  const wasRunningRef = useRef(false);

  useEffect(() => {
    if (isRunning && !wasRunningRef.current) {
      const displayNode = nodes.find(
        (node) =>
          findNodeSpec(node.data.node_uid)?.node_info.node_type === 'DISPLAY'
      );
      if (displayNode) {
        selectNode(displayNode.id);
      }
    }
    wasRunningRef.current = isRunning;
  }, [isRunning, nodes, selectNode]);

  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const addNode = useCanvasStore((s) => s.addNode);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection, { workspaceId, workflowId });
    },
    [onConnect, workspaceId, workflowId]
  );

  // Enforce the node specs while dragging a connection, so edges that would
  // violate a node's requirement (group compatibility, in/out edge caps) can't
  // be drawn in the first place.
  const isValidConnection = useCallback(
    (connection: Connection | Edge<WorkflowEdgeData>) =>
      canConnect(nodes, edges, connection),
    [nodes, edges]
  );

  const onNodeDragStop = useCallback(() => {
    saveWorkflow({ workspaceId, workflowId });
  }, [saveWorkflow, workspaceId, workflowId]);

  const onInit = useCallback(
    (
      instance: ReactFlowInstance<
        Node<WorkflowNodeData>,
        Edge<WorkflowEdgeData>
      >
    ) => {
      reactFlowInstance.current = instance;
    },
    []
  );

  function handleDragStart(e: DragStartEvent) {
    setDragItem((e.active.data.current as PaletteDragData | null) ?? null);
  }

  function handleDragEnd(e: DragEndEvent) {
    setDragItem(null);

    const payload = e.active.data.current as PaletteDragData | undefined;
    const activator = e.activatorEvent;
    const instance = reactFlowInstance.current;
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!payload || !(activator instanceof PointerEvent) || !instance) {
      return;
    }

    // Final pointer position: where the drag started plus how far it moved.
    const x = activator.clientX + e.delta.x;
    const y = activator.clientY + e.delta.y;

    // Only drops on the canvas count — not outside it, not on the palette.
    if (
      !bounds ||
      x < bounds.left ||
      x > bounds.right ||
      y < bounds.top ||
      y > bounds.bottom ||
      document.elementFromPoint(x, y)?.closest('[data-node-palette]')
    ) {
      return;
    }

    // Center the new node on the cursor.
    const position = instance.screenToFlowPosition({ x, y });
    addNode({ workspaceId, workflowId }, payload.uid, payload.label, {
      x: position.x - NODE_DIMENSIONS.WIDTH / 2,
      y: position.y - NODE_DIMENSIONS.HEIGHT / 2,
    });
  }

  return (
    <CanvasModeContext.Provider value={{ readOnly: false, run }}>
      <WorkflowCanvasProvider canvas={canvas}>
        <DndContext
          sensors={sensors}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={() => {
            setDragItem(null);
          }}
        >
          <div ref={wrapperRef} className='bg-canvas relative min-h-0 flex-1'>
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={handleConnect}
              isValidConnection={isValidConnection}
              onNodeDragStop={onNodeDragStop}
              onInit={onInit}
              selectNodesOnDrag={false}
              fitView={fitViewOnLoad}
              fitViewOptions={{ maxZoom: 1 }}
              snapToGrid
              snapGrid={[12, 12]}
              proOptions={{ hideAttribution: true }}
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={50}
                size={1.5}
              />
              <WorkflowCanvasHelperLines />
              <CanvasPalette />
            </ReactFlow>
            <NodePalette />
            <NodePanel node={selectedNode} loading={isRunning} />
          </div>

          <NodeDragPreview dragItem={dragItem} />
        </DndContext>
      </WorkflowCanvasProvider>
    </CanvasModeContext.Provider>
  );
}
