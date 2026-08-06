'use client';

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { useQuery } from 'convex/react';
import {
  ChevronDownIcon,
  CircleCheckIcon,
  CircleXIcon,
  HistoryIcon,
  Loader2Icon,
} from 'lucide-react';
import Link from 'next/link';

import { useRequiredWorkspaceParams } from '../../../../_hooks/use-workspace-params';

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
  };

function formatTime(ms: number) {
  return new Date(ms).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

type RunHistoryPaletteProps = {
  selectedId: Id<'runHistory'> | undefined;
};

/** Floating list of a workflow's runs in the top-left of the canvas; clicking
 * a run loads its snapshot into the read-only canvas. */
export function RunHistoryPalette({ selectedId }: RunHistoryPaletteProps) {
  const { workspaceName, workflowId } = useRequiredWorkspaceParams();
  const runs = useQuery(api.runHistory.list, { workspaceName, workflowId });

  const base = `/${encodeURIComponent(workspaceName)}/workflow/${workflowId}/run-history`;

  return (
    <Collapsible
      defaultOpen
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute top-4 left-4 z-10 flex w-56 flex-col
        rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
    >
      <CollapsibleTrigger
        className='group/palette hover:bg-accent hover:text-accent-foreground
          flex w-full cursor-pointer items-center justify-between rounded-md
          px-2 py-1.5 text-[13px] font-medium select-none'
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

      <CollapsibleContent
        className='flex h-(--collapsible-panel-height) flex-col overflow-hidden
          transition-[height] duration-200 ease-out data-ending-style:h-0
          data-starting-style:h-0'
      >
        <div className='flex max-h-64 flex-col overflow-y-auto'>
          {runs === undefined ? (
            <div className='text-muted-foreground px-2 py-1.5 text-[13px]'>
              Loading…
            </div>
          ) : runs.length === 0 ? (
            <div className='text-muted-foreground px-2 py-1.5 text-[13px]'>
              No runs yet.
            </div>
          ) : (
            runs.map((run) => {
              const meta = STATUS_META[run.status];
              const isSelected = run._id === selectedId;
              return (
                <Link
                  key={run._id}
                  href={`${base}/${run._id}`}
                  className={cn(
                    `hover:bg-accent hover:text-accent-foreground flex
                      items-center gap-2 rounded-md px-2 py-1.5 text-[13px]
                      font-medium select-none`,
                    isSelected && 'bg-accent text-accent-foreground'
                  )}
                >
                  <meta.icon
                    className={cn(
                      'size-3.5 shrink-0',
                      meta.className,
                      run.status === 'running' && 'animate-spin'
                    )}
                  />
                  <span className='truncate'>{formatTime(run.startedAt)}</span>
                </Link>
              );
            })
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
