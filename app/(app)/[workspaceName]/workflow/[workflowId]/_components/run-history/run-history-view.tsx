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

  function renderCanvas() {
    if (runHistoryId === undefined) {
      return (
        <div
          className='text-muted-foreground flex flex-1 items-center
            justify-center text-sm'
        >
          Select a run to view its canvas.
        </div>
      );
    }
    // Query still loading — hold the space without a message.
    if (run === undefined) {
      return <div className='flex-1' />;
    }
    if (run === null) {
      return (
        <div
          className='text-muted-foreground flex flex-1 items-center
            justify-center text-sm'
        >
          Run not found.
        </div>
      );
    }
    return <RunHistoryCanvas run={run} />;
  }

  return (
    <div className='bg-canvas relative flex min-h-0 flex-1'>
      {renderCanvas()}
      <RunHistoryPalette selectedId={runHistoryId} />
    </div>
  );
}
