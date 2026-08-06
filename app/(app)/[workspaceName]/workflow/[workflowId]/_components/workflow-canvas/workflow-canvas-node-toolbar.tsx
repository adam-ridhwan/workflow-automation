'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CopyIcon, StickyNoteIcon, Trash2Icon } from 'lucide-react';

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
  const setNodeAnnotation = useCanvasStore((s) => s.setNodeAnnotation);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const hasAnnotation = useCanvasStore(
    (s) =>
      s.nodes.find((node) => node.id === nodeId)?.data.annotation !== undefined
  );

  return (
    <div className='nodrag hidden shrink-0 items-center group-hover/node:flex'>
      {!hasAnnotation && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-xs'
                aria-label='Add note'
                disabled={isRunning}
                onClick={() => {
                  setNodeAnnotation(nodeId, '');
                }}
              >
                <StickyNoteIcon className='text-muted-foreground' />
              </Button>
            }
          />
          <TooltipContent>Add note</TooltipContent>
        </Tooltip>
      )}
      <Tooltip>
        <TooltipTrigger
          render={
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
          }
        />
        <TooltipContent>Clone</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
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
          }
        />
        <TooltipContent>Delete</TooltipContent>
      </Tooltip>
    </div>
  );
}
