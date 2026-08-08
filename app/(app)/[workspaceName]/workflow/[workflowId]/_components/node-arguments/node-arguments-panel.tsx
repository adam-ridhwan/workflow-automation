'use client';

import { Card } from '@/components/ui/card';
import { findNodeSpec } from '@/lib/node-specs';
import { CircleIcon } from 'lucide-react';

import { NODE_META } from '../../_constants/node-meta';
import { NodeArguments } from './node-arguments';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type NodeArgumentsPanelProps = {
  node: Node<WorkflowNodeData> | null;
};

/** Floating panel on the right of the canvas showing the given node's
 * arguments, so the nodes themselves stay compact. */
export function NodeArgumentsPanel({ node }: NodeArgumentsPanelProps) {
  if (node === null) {
    return null;
  }

  const spec = findNodeSpec(node.data.node_uid);
  // Display nodes have their own output panel, not a config panel.
  if (spec?.node_info.node_type === 'DISPLAY') {
    return null;
  }

  const meta = NODE_META[node.data.node_uid];
  const Icon = meta?.icon ?? CircleIcon;
  const hasArguments =
    spec?.node_arguments.some(
      (argument) => !argument.is_hidden && !argument.is_deprecated
    ) ?? false;

  return (
    <div className='absolute top-3 right-3 bottom-3 z-10 flex w-80'>
      <Card className='flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0'>
        <div className='flex items-center gap-2.5 border-b px-4 py-3'>
          <div
            className='bg-muted flex size-8 shrink-0 items-center justify-center
              rounded-md'
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

        <div className='min-h-0 flex-1 overflow-y-auto py-1'>
          {hasArguments ? (
            <NodeArguments nodeId={node.id} data={node.data} />
          ) : (
            <p className='text-muted-foreground px-4 py-2 text-[13px]'>
              This node has no settings.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
