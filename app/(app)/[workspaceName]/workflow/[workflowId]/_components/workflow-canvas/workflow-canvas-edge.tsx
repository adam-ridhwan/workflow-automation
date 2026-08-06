'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { BaseEdge, EdgeLabelRenderer, getBezierPath } from '@xyflow/react';
import { XIcon } from 'lucide-react';

import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { useCanvasMode } from './canvas-mode-context';

import type { EdgeProps } from '@xyflow/react';

export function WorkflowCanvasEdge({
  id,
  sourceX,
  sourceY,
  sourcePosition,
  targetX,
  targetY,
  targetPosition,
  markerEnd,
  style,
}: EdgeProps) {
  const { readOnly } = useCanvasMode();
  const { workspaceName, workflowId } = useWorkspaceParams();
  const deleteEdge = useCanvasStore((s) => s.deleteEdge);
  const [hovered, setHovered] = useState(false);

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
      {!readOnly && (
        <>
          {/* Invisible wide path so the whole edge is easy to hover. */}
          <path
            d={edgePath}
            fill='none'
            stroke='transparent'
            strokeWidth={24}
            className='pointer-events-auto'
            onMouseEnter={() => {
              setHovered(true);
            }}
            onMouseLeave={() => {
              setHovered(false);
            }}
          />
          <EdgeLabelRenderer>
            <div
              className={cn(
                'nodrag nopan pointer-events-auto absolute',
                hovered ? 'opacity-100' : 'opacity-0'
              )}
              style={{
                transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
              }}
              onMouseEnter={() => {
                setHovered(true);
              }}
              onMouseLeave={() => {
                setHovered(false);
              }}
            >
              <Button
                variant='outline'
                size='icon-sm'
                aria-label='Delete connection'
                onClick={() => {
                  deleteEdge({ workspaceName, workflowId }, id);
                }}
              >
                <XIcon className='size-3' />
              </Button>
            </div>
          </EdgeLabelRenderer>
        </>
      )}
    </>
  );
}
