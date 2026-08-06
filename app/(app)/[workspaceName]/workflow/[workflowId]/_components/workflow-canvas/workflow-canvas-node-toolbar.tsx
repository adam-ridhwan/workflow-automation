'use client';

import { Button } from '@/components/ui/button';
import { CopyIcon, Trash2Icon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

type WorkflowCanvasNodeToolbarProps = {
  nodeId: string;
};

/** Clone/delete controls in the node header, shown while hovering the node.
 * Requires `group/node` on the node card. */
export function WorkflowCanvasNodeToolbar({
  nodeId,
}: WorkflowCanvasNodeToolbarProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const cloneNode = useCanvasStore((s) => s.cloneNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const isRunning = useCanvasStore((s) => s.isRunning);

  return (
    <div className='nodrag hidden shrink-0 items-center group-hover/node:flex'>
      <Button
        variant='ghost'
        size='icon-xs'
        aria-label='Clone node'
        disabled={isRunning}
        onClick={() => {
          cloneNode({ workspaceName, workflowId }, nodeId);
        }}
      >
        <CopyIcon className='text-muted-foreground' />
      </Button>
      <Button
        variant='ghost'
        size='icon-xs'
        aria-label='Delete node'
        disabled={isRunning}
        onClick={() => {
          deleteNode({ workspaceName, workflowId }, nodeId);
        }}
      >
        <Trash2Icon className='text-muted-foreground' />
      </Button>
    </div>
  );
}
