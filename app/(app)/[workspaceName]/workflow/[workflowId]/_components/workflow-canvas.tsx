'use client';

import { useCallback, useMemo } from 'react';
import { WorkflowCanvasData } from '@/convex/canvas';
import { Background, BackgroundVariant, ReactFlow } from '@xyflow/react';

import { WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { useCanvasStore } from '../_store/canvas-store';
import { useWorkflowId } from '../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../_hooks/use-workspace-name';
import { CanvasPalette } from './canvas-palette';
import { WorkflowNode } from './workflow-node';
import { WorkflowProvider } from './workflow-provider';
import { WorkflowEdge } from './workfow-edge';

import type { Connection } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

type WorkflowCanvasProps = {
  canvas: WorkflowCanvasData;
};

export function WorkflowCanvas({ canvas }: WorkflowCanvasProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();

  const nodeTypes = useMemo(() => ({ [WORKFLOW_NODE]: WorkflowNode }), []);
  const edgeTypes = useMemo(() => ({ [WORKFLOW_EDGE]: WorkflowEdge }), []);

  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);
  const onNodesChange = useCanvasStore((s) => s.onNodesChange);
  const onEdgesChange = useCanvasStore((s) => s.onEdgesChange);
  const storeOnConnect = useCanvasStore((s) => s.onConnect);
  const saveWorkflow = useCanvasStore((s) => s.saveWorkflow);

  const onConnect = useCallback(
    (connection: Connection) => {
      storeOnConnect(connection, { workspaceName, workflowId });
    },
    [storeOnConnect, workspaceName, workflowId]
  );

  const onNodeDragStop = useCallback(() => {
    saveWorkflow({ workspaceName, workflowId });
  }, [saveWorkflow, workspaceName, workflowId]);

  return (
    <WorkflowProvider canvas={canvas}>
      <div className='min-h-0 flex-1'>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeDragStop={onNodeDragStop}
          proOptions={{ hideAttribution: true }}
        >
          <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
          <CanvasPalette />
        </ReactFlow>
      </div>
    </WorkflowProvider>
  );
}
