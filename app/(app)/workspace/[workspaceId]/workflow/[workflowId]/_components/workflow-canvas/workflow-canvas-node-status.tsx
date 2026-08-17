'use client';

import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/cn';
import { CircleCheckIcon, CircleXIcon, Loader2Icon } from 'lucide-react';

import { useCanvasMode } from './canvas-mode-context';

import type { NodeStatus } from '@/convex/runs';
import type { LucideIcon } from 'lucide-react';

const STATUS_META: Record<
  NodeStatus,
  { label: string; icon: LucideIcon; variant: 'running' | 'success' | 'error' }
> = {
  running: { label: 'Running', icon: Loader2Icon, variant: 'running' },
  success: { label: 'Success', icon: CircleCheckIcon, variant: 'success' },
  error: { label: 'Error', icon: CircleXIcon, variant: 'error' },
};

type WorkflowCanvasNodeStatusProps = {
  nodeId: string;
};

/** Live status badge floating just below the node. */
export function WorkflowCanvasNodeStatus({
  nodeId,
}: WorkflowCanvasNodeStatusProps) {
  const { run } = useCanvasMode();
  const status = run?.nodeStatuses[nodeId];
  if (!status) {
    return null;
  }

  const meta = STATUS_META[status];
  const badgeClassName =
    'absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 text-[11px]';
  const badge = (
    <Badge variant={meta.variant} className={badgeClassName}>
      <meta.icon className={cn(status === 'running' && 'animate-spin')} />
      {meta.label}
    </Badge>
  );

  // A failed node's badge reveals the run's error message on hover.
  if (status === 'error' && run?.error) {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger
          openOnHover
          nativeButton={false}
          render={
            <Badge
              variant={meta.variant}
              className={cn(badgeClassName, 'cursor-pointer')}
            />
          }
        >
          <meta.icon />
          {meta.label}
        </DropdownMenuTrigger>
        <DropdownMenuContent
          side='bottom'
          align='center'
          className='max-w-72 min-w-48'
        >
          <div
            className='text-destructive px-2 py-1.5 text-[13px] wrap-break-word
              whitespace-pre-wrap'
          >
            {run.error}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return badge;
}
