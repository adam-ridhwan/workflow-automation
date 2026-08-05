'use client';

import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/cn';
import { Position } from '@xyflow/react';
import { CircleIcon, CopyIcon, Trash2Icon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { findNodeSpec } from '../../_lib/get-node-spec';
import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';
import { NodeArguments } from '../node-arguments/node-arguments';
import { WorkflowCanvasPort } from './workflow-canvas-port';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node, NodeProps } from '@xyflow/react';

const DISPLAY_NODE_UID = 'N_008';

export function WorkflowCanvasNode({
  id,
  data,
  selected,
}: NodeProps<Node<WorkflowNodeData>>) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const cloneNode = useCanvasStore((s) => s.cloneNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  const meta = NODE_META[data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;

  const nodeSpec = findNodeSpec(data.node_uid);
  const hasInPort = (nodeSpec?.node_requirement.max_in_edges ?? 1) > 0;
  const hasOutPort = (nodeSpec?.node_requirement.max_out_edges ?? 1) > 0;

  const output = useCanvasStore((s) => s.nodeOutputs[id]);
  const showsOutput =
    data.node_uid === DISPLAY_NODE_UID && output !== undefined;

  return (
    <Card
      className={cn(
        'flex w-64 flex-col gap-0 overflow-visible rounded-md p-0 shadow-sm',
        selected && 'ring-primary'
      )}
    >
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

        {selected && (
          <div className='nodrag flex shrink-0 items-center'>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label='Clone node'
              onClick={() => {
                cloneNode({ workspaceName, workflowId }, id);
              }}
            >
              <CopyIcon className='text-muted-foreground' />
            </Button>
            <Button
              variant='ghost'
              size='icon-xs'
              aria-label='Delete node'
              onClick={() => {
                deleteNode({ workspaceName, workflowId }, id);
              }}
            >
              <Trash2Icon className='text-muted-foreground' />
            </Button>
          </div>
        )}
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
