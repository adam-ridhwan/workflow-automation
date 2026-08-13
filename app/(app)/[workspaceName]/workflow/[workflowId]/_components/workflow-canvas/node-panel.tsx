'use client';

import { Card } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Markdown } from '@/components/ui/markdown';
import { findNodeSpec } from '@/lib/node-specs';
import { CircleIcon, InboxIcon, Loader2Icon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { NodeArguments } from '../node-arguments/node-arguments';
import { useCanvasMode } from './canvas-mode-context';
import { WorkflowCanvasNodeToolbar } from './workflow-canvas-node-toolbar';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type NodePanelProps = {
  node: Node<WorkflowNodeData> | null;
  /** Whether the workflow is currently running — shows a loader in the output
   * panel until the display node has a result. */
  loading?: boolean;
};

/** Right-side inspector for the selected node. Header, actions, and node
 * preview are shared; the body shows the node's output for display nodes and
 * its configuration otherwise. */
export function NodePanel({ node, loading = false }: NodePanelProps) {
  const { readOnly, run } = useCanvasMode();

  if (node === null) {
    return null;
  }

  const spec = findNodeSpec(node.data.node_uid);
  const isDisplay = spec?.node_info.node_type === 'DISPLAY';
  const meta = NODE_META[node.data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;
  const hasArguments =
    spec?.node_arguments.some(
      (argument) => !argument.is_hidden && !argument.is_deprecated
    ) ?? false;
  const output = run?.nodeOutputs[node.id];

  function renderBody(activeNode: Node<WorkflowNodeData>) {
    if (isDisplay) {
      const hasOutput = output !== undefined && output !== '';

      let body = (
        <Empty>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <InboxIcon />
            </EmptyMedia>
            <EmptyTitle>No output yet</EmptyTitle>
            <EmptyDescription>
              Run the workflow to see the result here.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );

      if (hasOutput) {
        body = <Markdown>{output}</Markdown>;
      } else if (loading) {
        body = (
          <div
            className='text-muted-foreground flex items-center gap-2
              text-[13px]'
          >
            <Loader2Icon className='size-4 animate-spin' />
            Running…
          </div>
        );
      }

      return <div className='px-4 py-3'>{body}</div>;
    }

    if (hasArguments) {
      return (
        <div className='py-1'>
          <NodeArguments nodeId={activeNode.id} data={activeNode.data} />
        </div>
      );
    }

    return (
      <p className='text-muted-foreground px-4 py-2 text-[13px]'>
        This node has no settings.
      </p>
    );
  }

  return (
    <div className='absolute top-3 right-3 bottom-3 z-10 flex w-80'>
      <Card className='flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0'>
        <div
          className='flex h-11 items-center justify-between gap-2 border-b px-4'
        >
          <div className='text-[13px] font-medium'>
            {isDisplay ? 'Output' : 'Configurations'}
          </div>
          {!readOnly && <WorkflowCanvasNodeToolbar nodeId={node.id} />}
        </div>

        <div
          className='bg-canvas flex shrink-0 items-center justify-center
            border-b px-4 py-6'
        >
          <div
            className='bg-card flex w-full max-w-56 items-center gap-2.5
              rounded-md border px-3 py-2.5'
          >
            <div
              className='bg-muted flex size-8 shrink-0 items-center
                justify-center rounded-md'
            >
              <Icon className='text-muted-foreground size-4' />
            </div>
            <div className='flex min-w-0 flex-col'>
              <div className='truncate text-[13px] font-medium'>
                {node.data.name}
              </div>
              {meta?.description && (
                <div className='text-muted-foreground truncate text-[11px]'>
                  {meta.description}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className='nowheel min-h-0 flex-1 overflow-y-auto'>
          {renderBody(node)}
        </div>
      </Card>
    </div>
  );
}
