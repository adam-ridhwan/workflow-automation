'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@xyflow/react';

import { useCanvasStore } from '../../_store/canvas-store';

import type { ReactFlowState } from '@xyflow/react';

const widthSelector = (state: ReactFlowState) => state.width;
const heightSelector = (state: ReactFlowState) => state.height;
const transformSelector = (state: ReactFlowState) => state.transform;

/** Canvas overlay that draws the alignment guide lines while dragging. */
export function WorkflowCanvasHelperLines() {
  const width = useStore(widthSelector);
  const height = useStore(heightSelector);
  const transform = useStore(transformSelector);
  const horizontal = useCanvasStore((s) => s.helperLineHorizontal);
  const vertical = useCanvasStore((s) => s.helperLineVertical);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) {
      return;
    }

    const dpi = window.devicePixelRatio;
    canvas.width = width * dpi;
    canvas.height = height * dpi;
    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, width, height);
    // Resolves text-primary on the canvas element to a paintable color.
    ctx.strokeStyle = getComputedStyle(canvas).color;
    ctx.lineWidth = 1;

    if (vertical !== undefined) {
      const x = vertical * transform[2] + transform[0];
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
    if (horizontal !== undefined) {
      const y = horizontal * transform[2] + transform[1];
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  }, [width, height, transform, horizontal, vertical]);

  return (
    <canvas
      ref={canvasRef}
      className='text-primary pointer-events-none absolute inset-0 z-10 h-full
        w-full'
    />
  );
}
