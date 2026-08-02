'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';

import { WORKFLOW_EDGE, WORKFLOW_NODE } from '../_lib/normalize';
import { WorkflowNode } from './workflow-node';
import { WorkflowEdge } from './workfow-edge';

import type { Edge, Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const nodeTypes = { [WORKFLOW_NODE]: WorkflowNode };
const edgeTypes = { [WORKFLOW_EDGE]: WorkflowEdge };

type WorkflowCanvasProps = {
  initialNodes: Node[];
  initialEdges: Edge[];
};

export function WorkflowCanvas({
  initialNodes,
  initialEdges,
}: WorkflowCanvasProps) {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className='min-h-0 flex-1'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
