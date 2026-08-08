'use client';

import { Card } from '@/components/ui/card';
import { findNodeSpec } from '@/lib/node-specs';

import { useCanvasMode } from './canvas-mode-context';
import { NodeOutputMarkdown } from './node-output-markdown';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type DisplayOutputPanelProps = {
  node: Node<WorkflowNodeData> | null;
};

/** Floating panel on the right showing the given display node's output, so the
 * node itself stays compact. Renders only for display nodes. */
export function DisplayOutputPanel({ node }: DisplayOutputPanelProps) {
  const { run } = useCanvasMode();

  if (node === null) {
    return null;
  }

  const spec = findNodeSpec(node.data.node_uid);
  if (spec?.node_info.node_type !== 'DISPLAY') {
    return null;
  }

  const output = run?.nodeOutputs[node.id];

  return (
    <div className='absolute top-3 right-3 bottom-3 z-10 flex w-80'>
      <Card className='flex min-h-0 flex-1 flex-col gap-0 overflow-hidden p-0'>
        <div className='flex flex-col border-b px-4 py-3'>
          <div className='truncate text-[13px] font-medium'>
            {node.data.name}
          </div>
          <div className='text-muted-foreground text-[11px]'>Output</div>
        </div>

        <div className='nowheel min-h-0 flex-1 overflow-y-auto px-4 py-3'>
          {output === undefined || output === '' ? (
            <span className='text-muted-foreground text-[13px]'>
              No output yet
            </span>
          ) : (
            <NodeOutputMarkdown output={output} />
          )}
        </div>
      </Card>
    </div>
  );
}
