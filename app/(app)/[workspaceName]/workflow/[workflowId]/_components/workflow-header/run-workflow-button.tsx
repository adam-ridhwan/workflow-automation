'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  ClockIcon,
  Loader2Icon,
  PlayIcon,
  RotateCcwIcon,
  SquareIcon,
} from 'lucide-react';
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
  const runPhase = useCanvasStore((s) => s.runPhase);
  const isStopping = useCanvasStore((s) => s.isStopping);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const errors = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);
  const isRerun = runHistoryId !== undefined;
  const workflow = useQuery(api.workflows.get, { workspaceName, workflowId });
  const isPublished = workflow?.isPublished ?? false;
  // On the run-history view, a run must be selected to re-run; the list route
  // (no id in the path) has nothing to run.
  const onRunHistory = pathname.includes('/run-history');
  const noRunSelected = onRunHistory && runHistoryId === undefined;

  let runTitle: string | undefined;
  if (!isPublished) {
    runTitle = 'Publish this workflow before running it.';
  } else if (noRunSelected) {
    runTitle = 'Select a run to re-run.';
  } else if (!isRerun) {
    runTitle = errors[0];
  }

  // A chain-driven run can't be stopped from here, so it shows a disabled
  // indicator: "Scheduled" while queued behind an earlier workflow, "Running…"
  // once it's executing.
  if (runPhase === 'scheduled' || runPhase === 'running') {
    return (
      <Button disabled className='w-36 gap-1.5'>
        {runPhase === 'scheduled' ? (
          <ClockIcon className='size-3.5' />
        ) : (
          <Loader2Icon className='size-3.5 animate-spin' />
        )}
        {runPhase === 'scheduled' ? 'Scheduled' : 'Running…'}
      </Button>
    );
  }

  // A run this client started ('local') can be stopped.
  if (runPhase === 'local') {
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
      disabled={
        !isPublished || noRunSelected || (!isRerun && errors.length > 0)
      }
      title={runTitle}
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
      {onRunHistory ? (
        <RotateCcwIcon className='size-3.5' />
      ) : (
        <PlayIcon className='size-3.5' />
      )}
      Run Workflow
    </Button>
  );
}
