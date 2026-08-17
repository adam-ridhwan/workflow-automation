'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Redo2Icon, Undo2Icon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

/** Header controls that undo/redo canvas edits by restoring the previous saved
 * snapshot and persisting it. Only rendered on the editable canvas route — the
 * store is shared, so they must not fire from the read-only run-history view. */
export function UndoRedoButtons() {
  const pathname = usePathname();
  const { workspaceId, workflowId } = useWorkspaceParams();
  const undo = useCanvasStore((s) => s.undo);
  const redo = useCanvasStore((s) => s.redo);
  const canUndo = useCanvasStore((s) => s.canUndo);
  const canRedo = useCanvasStore((s) => s.canRedo);
  const isRunning = useCanvasStore((s) => s.runPhase !== 'idle');

  if (!pathname.endsWith('/canvas')) {
    return null;
  }

  return (
    <div className='flex items-center'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label='Undo'
              disabled={!canUndo || isRunning}
              onClick={() => {
                undo({ workspaceId, workflowId });
              }}
            >
              <Undo2Icon className='size-4' />
            </Button>
          }
        />
        <TooltipContent>Undo</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon'
              aria-label='Redo'
              disabled={!canRedo || isRunning}
              onClick={() => {
                redo({ workspaceId, workflowId });
              }}
            >
              <Redo2Icon className='size-4' />
            </Button>
          }
        />
        <TooltipContent>Redo</TooltipContent>
      </Tooltip>
    </div>
  );
}
