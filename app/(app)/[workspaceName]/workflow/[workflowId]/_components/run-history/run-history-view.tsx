'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { RunHistoryCanvas } from './run-history-canvas';
import { RunHistoryPalette } from './run-history-palette';

/** Run-history workspace: a read-only canvas of the selected run (from the
 * URL) with a palette of all runs. */
export function RunHistoryView() {
  const { workspaceName, workflowId, runHistoryId } = useWorkspaceParams();

  const run = useQuery(
    api.runHistory.get,
    runHistoryId ? { workspaceName, workflowId, runHistoryId } : 'skip'
  );

  return (
    <div className='bg-canvas relative flex min-h-0 flex-1'>
      {runHistoryId === undefined ? (
        <div
          className='text-muted-foreground flex flex-1 items-center
            justify-center text-sm'
        >
          Select a run to view its canvas.
        </div>
      ) : run === undefined ? (
        <div className='flex-1' />
      ) : run === null ? (
        <div
          className='text-muted-foreground flex flex-1 items-center
            justify-center text-sm'
        >
          Run not found.
        </div>
      ) : (
        <RunHistoryCanvas run={run} />
      )}

      <RunHistoryPalette selectedId={runHistoryId} />
    </div>
  );
}
