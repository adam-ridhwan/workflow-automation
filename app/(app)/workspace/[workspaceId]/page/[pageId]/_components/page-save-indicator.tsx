'use client';

import { CheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';

import { usePageStore } from '../_store/page-store';

/** Reflects the page's save state, using the same look and min-delay logic as
 * the workflow canvas save indicator. */
export function PageSaveIndicator() {
  const saveStatus = usePageStore((s) => s.saveStatus);

  if (saveStatus === 'saving') {
    return (
      <span className='text-muted-foreground flex items-center gap-1.5 p-2 text-xs'>
        <Loader2Icon className='size-3.5 animate-spin' />
        Saving…
      </span>
    );
  }

  if (saveStatus === 'error') {
    return (
      <span className='text-destructive flex items-center gap-1.5 p-2 text-xs'>
        <TriangleAlertIcon className='size-3.5' />
        Not saved
      </span>
    );
  }

  return (
    <span className='text-muted-foreground flex items-center gap-1.5 p-2 text-xs'>
      <CheckIcon className='size-3.5' />
      Saved
    </span>
  );
}
