import { Loader2Icon } from 'lucide-react';

/** Loading UI shown while a workflow's canvas is being fetched — e.g. right
 * after creating a workflow and routing to its canvas. */
export function WorkflowCanvasLoading() {
  return (
    <div
      className='bg-canvas relative flex min-h-0 flex-1 items-center
        justify-center overflow-hidden'
    >
      <Loader2Icon
        className='text-muted-foreground size-6 animate-spin'
        aria-label='Loading workflow'
      />
    </div>
  );
}
