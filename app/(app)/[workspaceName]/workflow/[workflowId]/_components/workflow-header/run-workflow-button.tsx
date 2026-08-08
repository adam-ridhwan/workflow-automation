'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2Icon, PlayIcon, SquareIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { validateWorkflow } from '../../_lib/validate-workflow';
import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

import type { Id } from '@/convex/_generated/dataModel';

/** Header button that runs the workflow. On the canvas it runs the current
 * canvas; on a run-history page it re-runs the selected run's snapshot. */
export function RunWorkflowButton() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();
  // A selected run reads as `.../run-history/<id>`.
  const runHistoryMatch = pathname.match(/\/run-history\/([^/]+)$/);
  const runHistoryId = runHistoryMatch
    ? (runHistoryMatch[1] as Id<'runHistory'>)
    : undefined;
  const runWorkflow = useCanvasStore((s) => s.runWorkflow);
  const stopWorkflow = useCanvasStore((s) => s.stopWorkflow);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const isStopping = useCanvasStore((s) => s.isStopping);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const errors = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);
  const isRerun = runHistoryId !== undefined;

  if (isRunning) {
    return (
      <Button
        variant='destructive'
        disabled={isStopping}
        onClick={() => {
          stopWorkflow({ workspaceName, workflowId });
        }}
        className='w-36 gap-1.5'
      >
        {isStopping ? (
          <Loader2Icon className='size-3.5 animate-spin' />
        ) : (
          <SquareIcon className='size-3.5' />
        )}
        {isStopping ? 'Stopping…' : 'Stop'}
      </Button>
    );
  }

  return (
    <Button
      disabled={!isRerun && errors.length > 0}
      title={isRerun ? undefined : errors[0]}
      onClick={async () => {
        const newRunId = await runWorkflow(
          { workspaceName, workflowId },
          runHistoryId
        );
        // After re-running a past run, open the new run's page.
        if (isRerun && newRunId !== undefined) {
          router.push(
            `/${encodeURIComponent(workspaceName)}/workflow/${workflowId}/run-history/${newRunId}`
          );
        }
      }}
      className='w-36 gap-1.5'
    >
      <PlayIcon className='size-3.5' />
      Run Workflow
    </Button>
  );
}
