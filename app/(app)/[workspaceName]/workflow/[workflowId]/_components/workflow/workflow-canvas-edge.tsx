'use client';

import { BaseEdge, getBezierPath } from '@xyflow/react';

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
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />
  );
}
