'use client';

import { Card } from '@/components/ui/card';
import { Handle, Position } from '@xyflow/react';
import { CircleIcon } from 'lucide-react';

import { NODE_META } from './node-palette';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

export function WorkflowNode({ data }: NodeProps<Node<WorkflowNodeData>>) {
  const meta = NODE_META[data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;

  return (
    <Card
      className='flex h-14 w-56 flex-row items-center gap-2.5 overflow-visible
        rounded-md p-0 px-3 shadow-sm'
    >
      <Handle type='target' position={Position.Left} />
      <div
        className='bg-muted flex size-8 shrink-0 items-center justify-center
          rounded-md'
      >
        <Icon className='text-muted-foreground size-4' />
      </div>
      <div className='flex min-w-0 flex-col'>
        <div className='truncate text-[13px] font-medium'>{data.name}</div>
        {meta?.description && (
          <div className='text-muted-foreground truncate text-[11px]'>
            {meta.description}
          </div>
        )}
      </div>
      <Handle type='source' position={Position.Right} />
    </Card>
  );
}
