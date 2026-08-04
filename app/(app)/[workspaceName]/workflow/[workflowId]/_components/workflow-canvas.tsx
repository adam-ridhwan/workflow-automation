'use client';

import { useCallback, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Card } from '@/components/ui/card';
import { WorkflowCanvasData } from '@/convex/canvas';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';

import { WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { NODE_DIMENSIONS } from '../_lib/organize-canvas-layout';
import { useCanvasStore } from '../_store/canvas-store';
import { useWorkflowId } from '../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../_hooks/use-workspace-name';
import { CanvasPalette } from './canvas-palette';
import { NodePalette } from './node-palette';
import { WorkflowNode } from './workflow-node';
import { WorkflowProvider } from './workflow-provider';
import { WorkflowEdge } from './workfow-edge';

import type { PaletteDragData } from './node-palette';
import type { WorkflowEdgeData, WorkflowNodeData } from '@/convex/canvas';
import type { DragEndEvent, DragStartEvent, Modifier } from '@dnd-kit/core';
import type { Connection, Edge, Node, ReactFlowInstance } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

// Center the overlay on the cursor, matching where the node will drop.
const snapCenterToCursor: Modifier = ({
  activatorEvent,
  draggingNodeRect,
  transform,
}) => {
  if (draggingNodeRect && activatorEvent instanceof PointerEvent) {
    return {
      ...transform,
      x:
        transform.x +
        (activatorEvent.clientX - draggingNodeRect.left) -
        draggingNodeRect.width / 2,
      y:
        transform.y +
        (activatorEvent.clientY - draggingNodeRect.top) -
        draggingNodeRect.height / 2,
    };
  }
  return transform;
};

type WorkflowCanvasProps = {
  canvas: WorkflowCanvasData;
};

export function WorkflowCanvas({ canvas }: WorkflowCanvasProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const reactFlowInstance = useRef<ReactFlowInstance<
    Node<WorkflowNodeData>,
    Edge<WorkflowEdgeData>
  > | null>(null);
  const [dragItem, setDragItem] = useState<PaletteDragData | null>(null);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  const nodeTypes = useMemo(() => ({ [WORKFLOW_NODE]: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ [WORKFLOW_EDGE]: WorkflowEdge }), []);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const storeOnConnect = useCanvasStore((s) => s.onConnect);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);
  const addNode = useCanvasStore((s) => s.addNode);

  const onConnect = useCallback(
    (connection: Connection) => {
      storeOnConnect(connection, { workspaceName, workflowId });
    },
    [storeOnConnect, workspaceName, workflowId]
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
    <WorkflowProvider canvas={canvas}>
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={() => {
          setDragItem(null);
        }}
      >
        <div ref={wrapperRef} className='relative min-h-0 flex-1'>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            edgeTypes={edgeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeDragStop={onNodeDragStop}
            onInit={onInit}
            proOptions={{ hideAttribution: true }}
          >
            <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
            <CanvasPalette />
          </ReactFlow>
          <NodePalette />
        </div>

        {typeof document !== 'undefined' &&
          createPortal(
            <DragOverlay
              dropAnimation={null}
              modifiers={[snapCenterToCursor]}
              style={{ width: 'auto', height: 'auto' }}
              className='pointer-events-none'
            >
              {dragItem && (
                <Card
                  className='flex h-12 w-48 flex-row items-center justify-center
                    gap-0 rounded-md p-0 px-4 text-sm font-medium shadow-sm'
                >
                  {dragItem.label}
                </Card>
              )}
            </DragOverlay>,
            document.body
          )}
      </DndContext>
    </WorkflowProvider>
  );
}
