'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format-time';
import { getInitials } from '@/lib/get-initials';

import type { RunHistory, RunTrigger } from '@/convex/runHistory';

type RunDetailsPanelProps = {
  run: RunHistory;
};

const TRIGGER_LABELS: Record<RunTrigger, string> = {
  manual: 'Manual',
  rerun: 'Re-run',
  webhook: 'Webhook',
  schedule: 'Schedule',
  chain: 'Chain',
};

/** Floating panel in the top-right of the run-history canvas: who ran the
 * selected run, when it ran, and its outcome message. */
export function RunDetailsPanel({ run }: RunDetailsPanelProps) {
  const runnerName = run.ranByName ?? 'Unknown';
  return (
    <div className='absolute top-0 right-0 z-10 flex max-h-full flex-col p-4'>
      <div
        className='menu-inverted bg-popover text-popover-foreground
          ring-foreground/10 flex w-56 flex-col gap-3 rounded-lg p-3 shadow-md
          ring-1 backdrop-blur-xl'
      >
        <div>
          <div className='text-muted-foreground text-[11px] font-medium'>
            Ran by
          </div>
          <div className='mt-1 flex items-center gap-2'>
            <Avatar size='sm'>
              <AvatarImage
                src={run.ranByImageUrl ?? undefined}
                alt={runnerName}
              />
              <AvatarFallback>{getInitials(runnerName)}</AvatarFallback>
            </Avatar>
            <span className='text-[13px]'>{runnerName}</span>
          </div>
        </div>
        <Field label='Ran at' value={formatTime(run.startedAt)} />
        <Field
          label='Trigger'
          value={run.trigger ? TRIGGER_LABELS[run.trigger] : 'Manual'}
        />
        <Field
          label='Message'
          value={run.message}
          className={cn(
            'wrap-break-word whitespace-pre-wrap',
            run.status === 'error' && 'text-destructive',
            run.status === 'success' && 'text-emerald-400'
          )}
        />
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div>
      <div className='text-muted-foreground text-[11px] font-medium'>
        {label}
      </div>
      <div className={cn('text-[13px]', className)}>{value}</div>
    </div>
  );
}
