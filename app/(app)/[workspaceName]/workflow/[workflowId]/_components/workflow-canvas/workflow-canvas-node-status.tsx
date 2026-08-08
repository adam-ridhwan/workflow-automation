'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { CircleCheckIcon, CircleXIcon, Loader2Icon } from 'lucide-react';

import { useCanvasMode } from './canvas-mode-context';

import type { NodeStatus } from '@/convex/runs';
import type { LucideIcon } from 'lucide-react';

const STATUS_META: Record<
  NodeStatus,
  { label: string; icon: LucideIcon; className: string }
> = {
  running: {
    label: 'Running',
    icon: Loader2Icon,
    className: 'bg-[#D8E3F7] text-blue-600 dark:text-blue-400',
  },
  success: {
    label: 'Success',
    icon: CircleCheckIcon,
    className: 'bg-[#D6ECE2] text-emerald-600 dark:text-emerald-400',
  },
  error: {
    label: 'Error',
    icon: CircleXIcon,
    className: 'bg-[#F7D9D9] text-red-600 dark:text-red-400',
  },
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
  return (
    <Badge
      variant='secondary'
      className={cn(
        'absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2 text-[11px]',
        meta.className
      )}
    >
      <meta.icon className={cn(status === 'running' && 'animate-spin')} />
      {meta.label}
    </Badge>
  );
}
