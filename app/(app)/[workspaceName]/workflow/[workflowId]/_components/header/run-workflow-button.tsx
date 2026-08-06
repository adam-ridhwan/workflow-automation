'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Loader2Icon, PlayIcon } from 'lucide-react';

import { validateWorkflow } from '../../_lib/validate-workflow';
import { useCanvasStore } from '../../_store/canvas-store';
import { useWorkflowId } from '../../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../../_hooks/use-workspace-name';

/** Header button that runs the whole canvas workflow. Disabled while the
 * workflow is running or misconfigured per the node specs. */
export function RunWorkflowButton() {
  const workflowId = useWorkflowId();
  const workspaceName = useWorkspaceName();
  const runWorkflow = useCanvasStore((s) => s.runWorkflow);
  const isRunning = useCanvasStore((s) => s.isRunning);
  const nodes = useCanvasStore((s) => s.nodes);
  const edges = useCanvasStore((s) => s.edges);

  const errors = useMemo(() => validateWorkflow(nodes, edges), [nodes, edges]);

  return (
    <Button
      disabled={isRunning || errors.length > 0}
      title={errors[0]}
      onClick={() => {
        runWorkflow({ workspaceName, workflowId });
      }}
      className='w-36 gap-1.5'
    >
      {isRunning ? (
        <Loader2Icon className='size-3.5 animate-spin' />
      ) : (
        <PlayIcon className='size-3.5' />
      )}
      {isRunning ? 'Running…' : 'Run Workflow'}
    </Button>
  );
}
