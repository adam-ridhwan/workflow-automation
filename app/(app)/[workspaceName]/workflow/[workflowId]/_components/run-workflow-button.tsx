'use client';

import { Button } from '@/components/ui/button';
import { Loader2Icon, PlayIcon } from 'lucide-react';

import { useCanvasStore } from '../_store/canvas-store';

/** Header button that runs the whole canvas workflow. */
export function RunWorkflowButton() {
  const runWorkflow = useCanvasStore((s) => s.runWorkflow);
  const isRunning = useCanvasStore((s) => s.isRunning);

  return (
    <Button
      size='sm'
      disabled={isRunning}
      onClick={() => {
        runWorkflow();
      }}
      className='gap-1.5'
    >
      {isRunning ? (
        <Loader2Icon className='size-3.5 animate-spin' />
      ) : (
        <PlayIcon className='size-3.5' />
      )}
      {isRunning ? 'Running…' : 'Run'}
    </Button>
  );
}
