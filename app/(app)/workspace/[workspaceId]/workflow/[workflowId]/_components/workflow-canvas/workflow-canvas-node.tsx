'use client';

import { Card } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/cn';
import { findNodeSpec } from '@/lib/node-specs';
import { Position, useNodeConnections } from '@xyflow/react';
import { CircleIcon, TriangleAlertIcon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import {
  hasMissingConnection,
  hasUnresolvedArguments,
} from '../../_lib/validate-workflow';
import { useCanvasStore } from '../../_store/canvas-store';
import { WorkflowCanvasNodeAnnotation } from './workflow-canvas-node-annotation';
import { WorkflowCanvasNodeStatus } from './workflow-canvas-node-status';
import { WorkflowCanvasPort } from './workflow-canvas-port';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

export function WorkflowCanvasNode({
  id,
  data,
  selected,
  dragging,
}: NodeProps<Node<WorkflowNodeData>>) {
  const meta = NODE_META[data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;

  // Highlighted while its chip is hovered in the LLM prompt's insert menu.
  const highlighted = useCanvasStore((s) => s.highlightedNodeId === id);

  const nodeSpec = findNodeSpec(data.node_uid);
  const hasInPort = (nodeSpec?.node_requirement.max_in_edges ?? 1) > 0;
  const hasOutPort = (nodeSpec?.node_requirement.max_out_edges ?? 1) > 0;
  const isBranch = nodeSpec?.node_info.node_type === 'BRANCH';

  // Live edge counts for this node, so a missing required connection surfaces
  // as a warning the same way an unresolved argument does.
  const incoming = useNodeConnections({ handleType: 'target' });
  const outgoing = useNodeConnections({ handleType: 'source' });

  const warnings: string[] = [];
  if (hasMissingConnection(data, incoming.length, outgoing.length)) {
    warnings.push('This node is missing a required connection.');
  }
  if (hasUnresolvedArguments(data)) {
    warnings.push('This node has unresolved argument fields.');
  }

  return (
    <Card
      className={cn(
        `group/node relative flex w-64 flex-col gap-0 overflow-visible
        rounded-md p-0`,
        dragging ? 'cursor-grabbing' : 'cursor-pointer',
        selected && 'ring-primary',
        highlighted &&
          'outline-primary outline-2 outline-offset-5 outline-dashed'
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
        className={cn(
          'group/header flex h-14 shrink-0 flex-row items-center gap-2.5 px-3',
          // Reserve room on the right for the branch node's inline port labels.
          isBranch && 'pr-12'
        )}
      >
        <div
          className='bg-muted flex size-8 shrink-0 items-center justify-center
            rounded-md'
        >
          <Icon className='text-muted-foreground size-4' />
        </div>

        <div className='flex min-w-0 flex-1 flex-col'>
          <div className='truncate text-[13px] font-medium'>{data.name}</div>
          {(meta?.description || warnings.length > 0) && (
            <div className='flex items-center gap-1'>
              {meta?.description && (
                <div
                  className='text-muted-foreground min-w-0 flex-1 truncate
                    text-[11px]'
                >
                  {meta.description}
                </div>
              )}

              {warnings.length > 0 && (
                <Tooltip>
                  <TooltipTrigger
                    render={
                      <span
                        className='flex shrink-0 items-center'
                        aria-label='Node warnings'
                      />
                    }
                  >
                    <TriangleAlertIcon className='size-3.5 text-amber-500' />
                  </TooltipTrigger>
                  <TooltipContent>
                    <div className='flex flex-col gap-0.5'>
                      {warnings.map((warning) => (
                        <span key={warning}>{warning}</span>
                      ))}
                    </div>
                  </TooltipContent>
                </Tooltip>
              )}
            </div>
          )}
        </div>
      </div>

      {isBranch ? (
        <>
          <WorkflowCanvasPort
            type='source'
            position={Position.Right}
            id='true'
            style={{ top: '32%' }}
          />
          <span
            className='pointer-events-none absolute top-[32%] right-3
              -translate-y-1/2 text-[10px] font-medium text-emerald-600
              dark:text-emerald-400'
          >
            True
          </span>
          <WorkflowCanvasPort
            type='source'
            position={Position.Right}
            id='false'
            style={{ top: '68%' }}
          />
          <span
            className='pointer-events-none absolute top-[68%] right-3
              -translate-y-1/2 text-[10px] font-medium text-red-600
              dark:text-red-400'
          >
            False
          </span>
        </>
      ) : (
        hasOutPort && (
          <WorkflowCanvasPort type='source' position={Position.Right} />
        )
      )}
    </Card>
  );
}
