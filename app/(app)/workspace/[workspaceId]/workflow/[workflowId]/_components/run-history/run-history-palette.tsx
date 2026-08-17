'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
  const { workspaceId, workflowId } = useWorkspaceParams();
  const runs = useQuery(api.runHistory.list, { workspaceId, workflowId });

  const base = `/workspace/${workspaceId}/workflow/${workflowId}/run-history`;

  const [open, setOpen] = useState(true);

  // Tallies for the footer summary.
  const counts = { success: 0, error: 0, running: 0 };
  for (const run of runs ?? []) {
    if (run.status === 'success') {
      counts.success += 1;
    } else if (run.status === 'error') {
      counts.error += 1;
    } else if (run.status === 'running') {
      counts.running += 1;
    }
  }

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
        <DropdownMenu key={run._id}>
          {/* The row is the trigger: hover opens the message; click routes. */}
          <DropdownMenuTrigger
            openOnHover
            nativeButton={false}
            render={
              <Link
                href={`${base}/${run._id}`}
                className={cn(
                  `hover:bg-accent hover:text-accent-foreground flex shrink-0
                  items-center gap-2 rounded-md px-2 py-1.5 text-[13px]
                  font-medium select-none`,
                  isSelected && 'bg-accent text-accent-foreground'
                )}
              />
            }
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
            <span className='text-muted-foreground ml-auto shrink-0 text-[11px]'>
              {formatTime(run.startedAt)}
            </span>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            side='right'
            align='start'
            sideOffset={8}
            className='max-w-64'
          >
            <div className='px-2 py-1.5'>
              <div className='text-muted-foreground text-[11px] font-medium'>
                Ran by
              </div>
              <div className='text-[13px]'>{run.ranByName ?? 'Unknown'}</div>
            </div>
            <div className='px-2 py-1.5'>
              <div className='text-muted-foreground text-[11px] font-medium'>
                Message
              </div>
              <div
                className={cn(
                  'text-[13px] wrap-break-word whitespace-pre-wrap',
                  run.status === 'error' && 'text-destructive',
                  run.status === 'success' && 'text-emerald-400'
                )}
              >
                {run.message}
              </div>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    });
  }

  return (
    <div className='absolute inset-y-0 left-0 z-10 flex flex-col p-4'>
      <Collapsible
        open={open}
        onOpenChange={setOpen}
        className={cn(
          `menu-inverted bg-popover text-popover-foreground ring-foreground/10
          flex min-h-0 w-56 flex-col rounded-lg p-1 shadow-md ring-1
          backdrop-blur-xl`,
          open && 'h-full'
        )}
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

        <CollapsibleContent
          className='flex min-h-0 flex-1 flex-col overflow-y-auto'
        >
          {renderRuns()}
        </CollapsibleContent>

        {runs !== undefined && (
          <div className='mt-1 flex shrink-0 flex-col gap-2 p-1'>
            <Card className='border-border gap-0 bg-transparent px-2.5 py-1.5'>
              <div className='flex items-center gap-2'>
                <span
                  className='text-foreground text-sm font-semibold tabular-nums'
                >
                  {counts.success}
                </span>
                <span className='text-foreground text-xs font-medium'>
                  Completed
                </span>
                <CircleCheckIcon
                  className='ml-auto size-3.5 shrink-0 text-emerald-400/70'
                />
              </div>
            </Card>
            <Card className='border-border gap-0 bg-transparent px-2.5 py-1.5'>
              <div className='flex items-center gap-2'>
                <span
                  className='text-foreground text-sm font-semibold tabular-nums'
                >
                  {counts.error}
                </span>
                <span className='text-foreground text-xs font-medium'>
                  Failed
                </span>
                <CircleXIcon
                  className='text-destructive/70 ml-auto size-3.5 shrink-0'
                />
              </div>
            </Card>
            <Card className='border-border gap-0 bg-transparent px-2.5 py-1.5'>
              <div className='flex items-center gap-2'>
                <span
                  className='text-foreground text-sm font-semibold tabular-nums'
                >
                  {counts.running}
                </span>
                <span className='text-foreground text-xs font-medium'>
                  In progress
                </span>
                <Loader2Icon
                  className='text-muted-foreground ml-auto size-3.5 shrink-0'
                />
              </div>
            </Card>
          </div>
        )}
      </Collapsible>
    </div>
  );
}
