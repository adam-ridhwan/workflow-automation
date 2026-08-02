'use client';

import { useEffect, useRef } from 'react';
import { ReactFlowProvider } from '@xyflow/react';

import { toFlowEdges, toFlowNodes } from '../_lib/normalize';
import { useCanvasStore } from '../_store/canvas-store';

import type { WorkflowCanvasData } from '@/convex/canvas';
import type { ReactNode } from 'react';

type WorkflowProviderProps = {
  children: ReactNode;
  canvas: WorkflowCanvasData;
};

export function WorkflowProvider({ children, canvas }: WorkflowProviderProps) {
  const initialized = useRef(false);
  const setCanvas = useCanvasStore((s) => s.setCanvas);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    setCanvas(toFlowNodes(canvas), toFlowEdges(canvas), canvas.version);
  }, [canvas, setCanvas]);

  return <ReactFlowProvider>{children}</ReactFlowProvider>;
}
