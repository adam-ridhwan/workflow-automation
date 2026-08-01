'use client';

import {
  Background,
  BackgroundVariant,
  Controls,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react';

import type { Edge, Node } from '@xyflow/react';

import '@xyflow/react/dist/style.css';

const initialNodes: Node[] = [];

const initialEdges: Edge[] = [];

export function WorkflowCanvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes);
  const [edges, , onEdgesChange] = useEdgesState(initialEdges);

  return (
    <div className='min-h-0 flex-1'>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
      >
        <Background variant={BackgroundVariant.Dots} gap={12} size={1} />
        <Controls />
      </ReactFlow>
    </div>
  );
}
