'use client';

import { Badge } from '@/components/ui/badge';
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
  return (
    <Badge
      variant={meta.variant}
      className='absolute top-full left-1/2 z-10 mt-2 -translate-x-1/2
        text-[11px]'
    >
      <meta.icon className={cn(status === 'running' && 'animate-spin')} />
      {meta.label}
    </Badge>
  );
}
