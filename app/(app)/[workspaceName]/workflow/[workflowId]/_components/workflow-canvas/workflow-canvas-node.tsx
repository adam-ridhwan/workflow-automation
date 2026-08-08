'use client';

import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { findNodeSpec } from '@/lib/node-specs';
import { Position } from '@xyflow/react';
import { CircleIcon, TriangleAlertIcon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { hasUnresolvedArguments } from '../../_lib/validate-workflow';
import { WorkflowCanvasNodeAnnotation } from './workflow-canvas-node-annotation';
import { WorkflowCanvasNodeStatus } from './workflow-canvas-node-status';
import { WorkflowCanvasPort } from './workflow-canvas-port';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

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
  const unresolved = hasUnresolvedArguments(data);

  return (
    <Card
      className={cn(
        `group/node relative flex w-64 flex-col gap-0 overflow-visible
        rounded-md p-0`,
        selected && 'ring-primary'
      )}
    >
      <WorkflowCanvasNodeAnnotation nodeId={id} data={data} />

      <WorkflowCanvasNodeStatus nodeId={id} />

      {hasInPort && (
        <WorkflowCanvasPort
          type='target'
          position={Position.Left}
          isConnectableStart={false}
        />
      )}

      <div
        className='group/header flex h-14 shrink-0 flex-row items-center gap-2.5
          px-3'
      >
        <div
          className='bg-muted flex size-8 shrink-0 items-center justify-center
            rounded-md'
        >
          <Icon className='text-muted-foreground size-4' />
        </div>

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='truncate text-[13px] font-medium'>{data.name}</div>
          {(meta?.description || unresolved) && (
            <div className='flex items-center gap-1'>
              {meta?.description && (
                <div
                  className='text-muted-foreground min-w-0 flex-1 truncate
                    text-[11px]'
                >
                  {meta.description}
                </div>
              )}

              {unresolved && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        className='flex shrink-0 items-center'
                        aria-label='Unresolved argument fields'
                      />
                    }
                  >
                    <TriangleAlertIcon className='size-3.5 text-amber-500' />
                  </TooltipTrigger>
                  <TooltipContent>
                    This node has unresolved argument fields.
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {hasOutPort && (
        <WorkflowCanvasPort type='source' position={Position.Right} />
      )}
    </Card>
  );
}
