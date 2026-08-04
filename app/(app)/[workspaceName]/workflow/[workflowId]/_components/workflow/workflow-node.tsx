'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { Position } from '@xyflow/react';
import { CircleIcon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { findNodeSpec } from '../../_lib/get-node-spec';
import { WorkflowPort } from './workflow-port';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

export function WorkflowNode({
  data,
  selected,
}: NodeProps<Node<WorkflowNodeData>>) {
  const meta = NODE_META[data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;

  const nodeSpec = findNodeSpec(data.node_uid);
  const hasInPort = (nodeSpec?.node_requirement.max_in_edges ?? 1) > 0;
  const hasOutPort = (nodeSpec?.node_requirement.max_out_edges ?? 1) > 0;

  return (
    <Card
      className={cn(
        `flex h-14 w-56 flex-row items-center gap-2.5 overflow-visible
        rounded-md p-0 px-3 shadow-sm`,
        selected && 'ring-primary'
      )}
    >
      {hasInPort && <WorkflowPort type='target' position={Position.Left} />}
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
      {hasOutPort && <WorkflowPort type='source' position={Position.Right} />}
    </Card>
  );
}
