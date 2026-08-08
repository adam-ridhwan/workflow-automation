'use client';

import { useWorkspaceParams } from '@/app/(app)/[workspaceName]/_hooks/use-workspace-params';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { CheckIcon, Loader2Icon, TriangleAlertIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

import { useCanvasStore } from '../../_store/canvas-store';

/** Shows whether the canvas is saved. Canvas-only, like the store edits it
 * reflects — the run-history view has nothing to save. */
export function SaveIndicator() {
  const pathname = usePathname();
  const saveStatus = useCanvasStore((s) => s.saveStatus);

  const { workspaceName, workflowId } = useWorkspaceParams();
  const workflow = useQuery(api.workflows.get, { workspaceName, workflowId });

  if (workflow === undefined || workflow === null) {
    return null;
  }

  if (!pathname.endsWith('/canvas')) {
    return null;
  }

  if (saveStatus === 'saving') {
    return (
      <span
        className='text-muted-foreground flex items-center gap-1.5 p-2 text-xs'
      >
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
    <span
      className='text-muted-foreground flex items-center gap-1.5 p-2 text-xs'
    >
      <CheckIcon className='size-3.5' />
      Saved
    </span>
  );
}
