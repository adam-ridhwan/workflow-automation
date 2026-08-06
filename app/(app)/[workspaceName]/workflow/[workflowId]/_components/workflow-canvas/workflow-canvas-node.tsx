'use client';

import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { findNodeSpec } from '@/lib/node-specs';
import { Position } from '@xyflow/react';
import { CircleIcon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { NodeArguments } from '../node-arguments/node-arguments';
import { useCanvasMode } from './canvas-mode-context';
import { NodeOutputMarkdown } from './node-output-markdown';
import { WorkflowCanvasNodeAnnotation } from './workflow-canvas-node-annotation';
import { WorkflowCanvasNodeStatus } from './workflow-canvas-node-status';
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

  const { readOnly, run } = useCanvasMode();
  const output = run?.nodeOutputs[id];
  const isDisplayNode = data.node_uid === DISPLAY_NODE_UID;

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
          {meta?.description && (
            <div className='text-muted-foreground truncate text-[11px]'>
              {meta.description}
            </div>
          )}
        </div>

        {!readOnly && <WorkflowCanvasNodeToolbar nodeId={id} />}
      </div>

      <NodeArguments nodeId={id} data={data} />

      {isDisplayNode && (
        <div
          className='nowheel border-border max-h-40 min-h-14 overflow-y-auto
            border-t px-3 py-2'
        >
          {output === undefined || output === '' ? (
            <span className='text-muted-foreground text-[11px]'>
              No output yet
            </span>
          ) : (
            <NodeOutputMarkdown output={output} />
          )}
        </div>
      )}

      {hasOutPort && (
        <WorkflowCanvasPort type='source' position={Position.Right} />
      )}
    </Card>
  );
}
