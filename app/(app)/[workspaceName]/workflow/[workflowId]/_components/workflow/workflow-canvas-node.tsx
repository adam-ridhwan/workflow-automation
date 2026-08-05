'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { Position } from '@xyflow/react';
import { CircleIcon } from 'lucide-react';

import { NODE_GROUP_META } from '../../_constants/node-groups';
import { NODE_META } from '../../_constants/node-meta';
import { findNodeSpec } from '../../_lib/get-node-spec';
import { useCanvasStore } from '../../_store/canvas-store';
import { NodeArguments } from '../node-arguments/node-arguments';
import { WorkflowCanvasNodeToolbar } from './workflow-canvas-node-toolbar';
import { WorkflowCanvasPort } from './workflow-canvas-port';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

const DISPLAY_NODE_UID = 'N_008';

export function WorkflowCanvasNode({
  id,
  data,
  selected,
}: NodeProps<Node<WorkflowNodeData>>) {
  const meta = NODE_META[data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;

  const nodeSpec = findNodeSpec(data.node_uid);
  const hasInPort = (nodeSpec?.node_requirement.max_in_edges ?? 1) > 0;
  const hasOutPort = (nodeSpec?.node_requirement.max_out_edges ?? 1) > 0;
  const groupMeta = nodeSpec
    ? NODE_GROUP_META[nodeSpec.node_info.node_group]
    : null;

  const output = useCanvasStore((s) => s.nodeOutputs[id]);
  const showsOutput =
    data.node_uid === DISPLAY_NODE_UID && output !== undefined;

  return (
    <Card
      className={cn(
        `group/node relative flex w-64 flex-col gap-0 overflow-visible
        rounded-md p-0 shadow-sm`,
        selected && 'ring-primary'
      )}
    >
      {groupMeta && (
        <div
          className='menu-inverted bg-popover text-popover-foreground absolute
            bottom-full left-0.5 -z-10 flex translate-y-1 items-center gap-1
            rounded-t-md px-2 pt-1 pb-1.5 text-[11px] font-medium
            backdrop-blur-xl'
        >
          <groupMeta.icon className='size-3 shrink-0' />
          {groupMeta.label}
        </div>
      )}

      {hasInPort && (
        <WorkflowCanvasPort type='target' position={Position.Left} />
      )}

      <div className='flex h-14 shrink-0 flex-row items-center gap-2.5 px-3'>
        <div
          className='bg-muted flex size-8 shrink-0 items-center justify-center
            rounded-md'
        >
          <Icon className='text-muted-foreground size-4' />
        </div>

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='truncate text-[13px] font-medium'>{data.name}</div>
          {meta?.description && (
            <div className='text-muted-foreground truncate text-[11px]'>
              {meta.description}
            </div>
          )}
        </div>

        <WorkflowCanvasNodeToolbar nodeId={id} />
      </div>

      <NodeArguments nodeId={id} data={data} />

      {showsOutput && (
        <div
          className='nowheel border-border max-h-40 overflow-y-auto border-t
            px-3 py-2 font-mono text-[11px] whitespace-pre-wrap'
        >
          {output === '' ? (
            <span className='text-muted-foreground'>(empty)</span>
          ) : (
            output
          )}
        </div>
      )}

      {hasOutPort && (
        <WorkflowCanvasPort type='source' position={Position.Right} />
      )}
    </Card>
  );
}
