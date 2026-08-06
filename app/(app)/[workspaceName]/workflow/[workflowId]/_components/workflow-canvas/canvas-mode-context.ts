'use client';

import { createContext, useContext } from 'react';

import type { RunStatus } from '@/convex/runHistory';

export type CanvasRun = {
  nodeStatuses: Record<string, RunStatus>;
  nodeOutputs: Record<string, string>;
};

type CanvasMode = {
  /** When true, nodes render read-only (no editing, no toolbar). */
  readOnly: boolean;
  /** The run whose statuses/outputs the nodes reflect: the live run while
   * editing, or a historical run in the run-history view. */
  run: CanvasRun | null | undefined;
};

export const CanvasModeContext = createContext<CanvasMode>({
  readOnly: false,
  run: undefined,
});

export function useCanvasMode() {
  return useContext(CanvasModeContext);
}
