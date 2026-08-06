'use client';

import { useCallback, useRef, useState } from 'react';
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';

import { WORKFLOW_EDGE, WORKFLOW_NODE } from '../../_lib/normalize';
import { NODE_DIMENSIONS } from '../../_lib/organize-canvas-layout';
import { useCanvasStore } from '../../_store/canvas-store';
import { useRequiredWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { CanvasPalette } from '../canvas-palette/canvas-palette';
import { NodeDragPreview } from '../node-palette/node-drag-preview';
import { NodePalette } from '../node-palette/node-palette';
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
  const { workspaceName, workflowId } = useRequiredWorkspaceParams();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<
    Node<WorkflowNodeData>,
    Edge<WorkflowEdgeData>
  > | null>(null);
  const [dragItem, setDragItem] = useState<PaletteDragData | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const onConnect = useCanvasStore((s) => s.onConnect);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const addNode = useCanvasStore((s) => s.addNode);

  const handleConnect = useCallback(
    (connection: Connection) => {
      onConnect(connection, { workspaceName, workflowId });
    },
    [onConnect, workspaceName, workflowId]
  );

  const onNodeDragStop = useCallback(() => {
    saveWorkflow({ workspaceName, workflowId });
  }, [saveWorkflow, workspaceName, workflowId]);

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

  function handleDragStart(event: DragStartEvent) {
    setDragItem((event.active.data.current as PaletteDragData | null) ?? null);
  }

  function handleDragEnd(event: DragEndEvent) {
    setDragItem(null);

    const payload = event.active.data.current as PaletteDragData | undefined;
    const activator = event.activatorEvent;
    const instance = reactFlowInstance.current;
    const bounds = wrapperRef.current?.getBoundingClientRect();
    if (!payload || !(activator instanceof PointerEvent) || !instance) {
      return;
    }

    // Final pointer position: where the drag started plus how far it moved.
    const x = activator.clientX + event.delta.x;
    const y = activator.clientY + event.delta.y;

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
    addNode({ workspaceName, workflowId }, payload.uid, payload.label, {
      x: position.x - NODE_DIMENSIONS.WIDTH / 2,
      y: position.y - NODE_DIMENSIONS.HEIGHT / 2,
    });
  }

  return (
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
            onNodeDragStop={onNodeDragStop}
            onInit={onInit}
            selectNodesOnDrag={false}
            snapToGrid
            snapGrid={[12, 12]}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <WorkflowCanvasHelperLines />
            <CanvasPalette />
          </ReactFlow>
          <NodePalette />
        </div>

        <NodeDragPreview dragItem={dragItem} />
      </DndContext>
    </WorkflowCanvasProvider>
  );
}
