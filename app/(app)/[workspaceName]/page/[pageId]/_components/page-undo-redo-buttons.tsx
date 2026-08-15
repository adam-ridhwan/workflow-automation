'use client';

import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Redo2Icon, Undo2Icon } from 'lucide-react';

import { usePageStore } from '../_store/page-store';

import type { Id } from '@/convex/_generated/dataModel';

type PageUndoRedoButtonsProps = {
  target: { workspaceName: string; pageId: Id<'pages'> };
};

/** Toolbar controls that undo/redo layout edits by restoring the previous saved
 * snapshot and persisting it. */
export function PageUndoRedoButtons({ target }: PageUndoRedoButtonsProps) {
  const undo = usePageStore((s) => s.undo);
  const redo = usePageStore((s) => s.redo);
  const canUndo = usePageStore((s) => s.canUndo);
  const canRedo = usePageStore((s) => s.canRedo);

  return (
    <div className='flex items-center'>
      <Tooltip>
        <TooltipTrigger
          render={
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label='Undo'
              disabled={!canUndo}
              onClick={() => {
                undo(target);
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
              size='icon-sm'
              aria-label='Redo'
              disabled={!canRedo}
              onClick={() => {
                redo(target);
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
