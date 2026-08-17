'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { CopyIcon, StickyNoteIcon, Trash2Icon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { DEFAULT_ANNOTATION } from './workflow-canvas-node-annotation-bar';

type WorkflowCanvasNodeToolbarProps = {
  nodeId: string;
};

/** Add-note / clone / delete controls for the selected node, shown in the
 * configuration panel. */
export function WorkflowCanvasNodeToolbar({
  nodeId,
}: WorkflowCanvasNodeToolbarProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const cloneNode = useCanvasStore((s) => s.cloneNode);
  const deleteNode = useCanvasStore((s) => s.deleteNode);
  const setNodeAnnotation = useCanvasStore((s) => s.setNodeAnnotation);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');
  const hasAnnotation = useCanvasStore(
    (s) =>
      s.nodes.find((node) => node.id === nodeId)?.data.annotation !== undefined
  );

  return (
    <div className='flex shrink-0 items-center'>
      {!hasAnnotation && (
        <Tooltip>
          <TooltipTrigger
            render={
              <Button
                variant='ghost'
                size='icon-sm'
                aria-label='Add note'
                disabled={isRunning}
                onClick={() => {
                  setNodeAnnotation(nodeId, DEFAULT_ANNOTATION);
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
              size='icon-sm'
              aria-label='Clone node'
              disabled={isRunning}
              onClick={() => {
                cloneNode({ workspaceId, workflowId }, nodeId);
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
              size='icon-sm'
              aria-label='Delete node'
              disabled={isRunning}
              onClick={() => {
                deleteNode({ workspaceId, workflowId }, nodeId);
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
