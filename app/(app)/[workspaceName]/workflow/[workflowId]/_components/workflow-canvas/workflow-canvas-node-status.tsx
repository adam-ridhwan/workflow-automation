'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { CircleCheckIcon, CircleXIcon, Loader2Icon } from 'lucide-react';

import { useWorkflowRun } from '../../_hooks/use-workflow-run';

import type { NodeStatus } from '@/convex/runs';
import type { LucideIcon } from 'lucide-react';

const STATUS_META: Record<
  NodeStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  running: {
    label: 'Running',
    icon: Loader2Icon,
    className: 'text-muted-foreground',
  },
  success: {
    label: 'Success',
    icon: CircleCheckIcon,
    className: 'text-emerald-600 dark:text-emerald-400',
  },
  error: {
    label: 'Error',
    icon: CircleXIcon,
    className: 'text-destructive',
  },
};

type WorkflowCanvasNodeStatusProps = {
  nodeId: string;
};

/** Live status badge floating on the node's top-right corner. */
export function WorkflowCanvasNodeStatus({
  nodeId,
}: WorkflowCanvasNodeStatusProps) {
  const run = useWorkflowRun();
  const status = run?.nodeStatuses[nodeId];
  if (!status) {
    return null;
  }

  const meta = STATUS_META[status];
  return (
    <Badge
      variant='secondary'
      className='menu-inverted bg-popover text-popover-foreground
        ring-foreground/10 absolute -top-2.5 right-2 z-10 text-[11px] shadow-md
        ring-1 backdrop-blur-xl'
    >
      <meta.icon
        className={cn(meta.className, status === 'running' && 'animate-spin')}
      />
      {meta.label}
    </Badge>
  );
}
