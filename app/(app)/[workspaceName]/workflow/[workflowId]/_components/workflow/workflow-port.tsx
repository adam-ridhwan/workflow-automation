'use client';

import { cn } from '@/lib/cn';
import { Handle, Position } from '@xyflow/react';

import type { HandleProps } from '@xyflow/react';

/** Styled connection port for workflow nodes; wraps React Flow's Handle. */
export function WorkflowPort({ className, position, ...props }: HandleProps) {
  return (
    <Handle
      position={position}
      className={cn(
        `after:bg-primary size-5! rounded-full! border-0! bg-transparent!
        after:absolute after:top-1/2 after:left-1/2 after:size-2
        after:-translate-x-1/2 after:-translate-y-1/2 after:rounded-full
        after:content-['']`,
        position === Position.Left,
        position === Position.Right,
        className
      )}
      {...props}
    />
  );
}
