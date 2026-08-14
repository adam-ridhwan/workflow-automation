'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { Loader2Icon } from 'lucide-react';

type WorkflowRunStateBadgeProps = {
  phase?: 'scheduled' | 'running';
  isStarting: boolean;
  isPublished: boolean;
};

/** Shows the live run state while a run is active, falling back to the
 * published/unpublished status when idle. */
export function WorkflowRunStateBadge({
  phase,
  isStarting,
  isPublished,
}: WorkflowRunStateBadgeProps) {
  if (phase === 'running' || isStarting) {
    return (
      <Badge
        variant='secondary'
        className='gap-1.5 rounded-full bg-blue-500/15 text-blue-600
          dark:text-blue-400'
      >
        <Loader2Icon className='size-3 animate-spin' />
        Running
      </Badge>
    );
  }

  if (phase === 'scheduled') {
    return (
      <Badge
        variant='secondary'
        className='gap-1.5 rounded-full bg-amber-500/15 text-amber-600
          dark:text-amber-400'
      >
        <span className='size-1.25 rounded-full bg-current' />
        Queued
      </Badge>
    );
  }

  return (
    <Badge
      variant='secondary'
      className={cn(
        'gap-1.5 rounded-full',
        isPublished
          ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
          : 'bg-muted text-muted-foreground'
      )}
    >
      <span className='size-1.25 rounded-full bg-current' />
      {isPublished ? 'Published' : 'Unpublished'}
    </Badge>
  );
}
