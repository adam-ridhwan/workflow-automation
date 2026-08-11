'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format-time';
import { useQuery } from 'convex/react';
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleSlashIcon,
  CircleXIcon,
  HistoryIcon,
  Loader2Icon,
} from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';
import type { RunStatus } from '@/convex/runHistory';
import type { LucideIcon } from 'lucide-react';

const STATUS_META: Record<RunStatus, { icon: LucideIcon; className: string }> =
  {
    running: { icon: Loader2Icon, className: 'text-muted-foreground' },
    success: {
      icon: CircleCheckIcon,
      className: 'text-emerald-600 dark:text-emerald-400',
    },
    error: { icon: CircleXIcon, className: 'text-destructive' },
    stopped: { icon: CircleSlashIcon, className: 'text-muted-foreground' },
  };

type RunHistoryPaletteProps = {
  selectedId: Id<'runHistory'> | undefined;
};

/** Floating list of a workflow's runs in the top-left of the canvas; clicking
 * a run loads its snapshot into the read-only canvas. */
export function RunHistoryPalette({ selectedId }: RunHistoryPaletteProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const runs = useQuery(api.runHistory.list, { workspaceName, workflowId });

  const base = `/${encodeURIComponent(workspaceName)}/workflow/${workflowId}/run-history`;

  function renderRuns() {
    if (runs === undefined) {
      return (
        <div className='text-muted-foreground px-2 py-1.5 text-[13px]'>
          Loading…
        </div>
      );
    }
    if (runs.length === 0) {
      return (
        <div className='text-muted-foreground px-2 py-1.5 text-[13px]'>
          No runs yet.
        </div>
      );
    }
    return runs.map((run, index) => {
      const meta = STATUS_META[run.status];
      const isSelected = run._id === selectedId;
      // Newest first, so the oldest run in the list is #1.
      const runNumber = runs.length - index;
      return (
        <Link
          key={run._id}
          href={`${base}/${run._id}`}
          className={cn(
            `hover:bg-accent hover:text-accent-foreground flex shrink-0
              items-center gap-2 rounded-md px-2 py-1.5 text-[13px] font-medium
              select-none`,
            isSelected && 'bg-accent text-accent-foreground'
          )}
        >
          <span className='flex size-4 shrink-0 items-center justify-center'>
            <meta.icon
              className={cn(
                'size-3.5',
                meta.className,
                run.status === 'running' && 'animate-spin'
              )}
            />
          </span>
          <span className='shrink-0'>Run # {runNumber}</span>
          <span className='text-muted-foreground ml-auto truncate text-[11px]'>
            {formatTime(run.startedAt)}
          </span>
        </Link>
      );
    });
  }

  return (
    <div className='absolute top-0 left-0 z-10 flex max-h-full flex-col p-4'>
      <Collapsible
        defaultOpen
        className='menu-inverted bg-popover text-popover-foreground
          ring-foreground/10 flex max-h-full min-h-0 w-56 flex-col rounded-lg
          p-1 shadow-md ring-1 backdrop-blur-xl'
      >
        <CollapsibleTrigger
          className='group/palette hover:bg-accent hover:text-accent-foreground
            flex w-full shrink-0 cursor-pointer items-center justify-between
            rounded-md px-2 py-1.5 text-[13px] font-medium select-none'
        >
          <span className='flex items-center gap-2'>
            <HistoryIcon className='text-muted-foreground size-3.5 shrink-0' />
            Run history
          </span>
          <ChevronDownIcon
            className='text-muted-foreground size-3.5 shrink-0
              transition-transform group-data-panel-open/palette:rotate-180'
          />
        </CollapsibleTrigger>

        <CollapsibleContent className='flex min-h-0 flex-col overflow-y-auto'>
          {renderRuns()}
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
