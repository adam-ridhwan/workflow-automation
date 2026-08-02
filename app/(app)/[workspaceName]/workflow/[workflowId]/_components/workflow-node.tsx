'use client';

import { Card } from '@/components/ui/card';
import { Handle, Position } from '@xyflow/react';

import type { NodeProps } from '@xyflow/react';

export function WorkflowNode({ data }: NodeProps) {
  const name = typeof data.name === 'string' ? data.name : 'Node';
  return (
    <Card
      className='flex h-12 w-48 flex-row items-center justify-center gap-0
        overflow-visible rounded-md p-0 px-4 text-sm font-medium shadow-sm'
    >
      <Handle type='target' position={Position.Left} />
      <div>{name}</div>
      <Handle type='source' position={Position.Right} />
    </Card>
  );
}
