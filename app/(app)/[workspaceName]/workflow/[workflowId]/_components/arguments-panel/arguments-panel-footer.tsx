'use client';

import { Button } from '@/components/ui/button';
import { CopyIcon, Trash2Icon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

import type { WorkflowNodeData } from '@/convex/canvas';
import type { Node } from '@xyflow/react';

type ArgumentsPanelFooterProps = {
  selectedNode: Node<WorkflowNodeData>;
};

export function ArgumentsPanelFooter({
  selectedNode,
}: ArgumentsPanelFooterProps) {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const cloneNode = useCanvasStore((s) => s.cloneNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);

  return (
    <div className='flex items-center gap-1'>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          cloneNode({ workspaceName, workflowId }, selectedNode.id);
        }}
        className='hover:bg-accent hover:text-accent-foreground flex-1 gap-2
          rounded-md text-[13px]'
      >
        <CopyIcon className='text-muted-foreground size-3.5' />
        Clone
      </Button>
      <Button
        variant='ghost'
        size='sm'
        onClick={() => {
          deleteNode({ workspaceName, workflowId }, selectedNode.id);
        }}
        className='hover:bg-accent hover:text-accent-foreground flex-1 gap-2
          rounded-md text-[13px]'
      >
        <Trash2Icon className='text-muted-foreground size-3.5' />
        Delete
      </Button>
    </div>
  );
}
