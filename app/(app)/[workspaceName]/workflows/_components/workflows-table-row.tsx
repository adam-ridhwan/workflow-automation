'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { formatTime } from '@/lib/format-time';
import { useAction, useMutation } from 'convex/react';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';

import { ResourceRowShell } from '../../_components/resource-row-shell';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { WorkflowRunStateBadge } from './workflow-run-state-badge';

import type { Workflow } from '@/convex/workflows';

type WorkflowsTableRowProps = {
  workflow: Workflow;
  /** Live run phase from `runs.phasesByWorkspace`; undefined when idle. */
  phase?: 'scheduled' | 'running';
  onDelete: () => void;
};

export function WorkflowsTableRow({
  workflow,
  phase,
  onDelete,
}: WorkflowsTableRowProps) {
  const { workspaceName } = useWorkspaceParams();
  const renameWorkflow = useMutation(api.workflows.rename);
  const runWorkflow = useAction(api.runWorkflow.run);
  const stopRun = useMutation(api.runHistory.stopRun);
  // True from the click until the run finishes (or errors). Survives alongside
  // `phase` so the control stays busy even before the run doc reports 'running'.
  const [isStarting, setIsStarting] = useState(false);

  const isRunning = phase === 'running' || isStarting;
  const isScheduled = phase === 'scheduled';
  const isBusy = isRunning || isScheduled;

  async function handleRun() {
    setIsStarting(true);
    try {
      await runWorkflow({ workspaceName, workflowId: workflow._id });
      toast.add({ type: 'success', title: 'Workflow ran successfully.' });
    } catch (error) {
      toast.add({
        type: 'error',
        title: errorMessage(error, 'The workflow run failed.'),
      });
    } finally {
      setIsStarting(false);
    }
  }

  async function handleStop() {
    try {
      await stopRun({ workspaceName, workflowId: workflow._id });
    } catch {
      toast.add({ type: 'error', title: 'Could not stop the run.' });
    }
  }

  return (
    <ResourceRowShell
      drag={{ kind: 'workflow', id: workflow._id, name: workflow.name }}
      href={`/${encodeURIComponent(workspaceName)}/workflow/${workflow._id}/canvas`}
      icon={<WorkflowIcon className='text-muted-foreground size-4 shrink-0' />}
      name={workflow.name}
      subtitle={workflow.description}
      onRename={(name) =>
        renameWorkflow({ workspaceName, workflowId: workflow._id, name })
      }
      renameErrorFallback='Could not rename workflow. Please try again.'
      cells={
        <>
          <TableCell className='px-5'>
            <WorkflowRunStateBadge
              phase={phase}
              isStarting={isStarting}
              isPublished={workflow.isPublished}
            />
          </TableCell>

          <TableCell className='text-muted-foreground px-5 text-xs'>
            {formatTime(workflow._creationTime)}
          </TableCell>

          <TableCell className='px-5'>
            <span className='flex min-w-0 items-center gap-2'>
              <UserAvatar
                user={{
                  name: workflow.ownerName,
                  email: workflow.ownerEmail,
                  avatar: workflow.ownerImageUrl ?? undefined,
                }}
                size='sm'
                className='relative'
                fallbackClassName='text-[10px] font-semibold'
              />
              <span className='truncate text-xs'>{workflow.ownerName}</span>
            </span>
          </TableCell>
        </>
      }
      actions={({ startRename }) => (
        <TableCell className='px-5'>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground relative size-7'
                  aria-label={`Actions for ${workflow.name}`}
                />
              }
            >
              <EllipsisVerticalIcon className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-46'>
              {phase === 'running' ? (
                <DropdownMenuItem onClick={handleStop}>
                  <SquareIcon className='fill-current' />
                  Stop run
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem disabled={isBusy} onClick={handleRun}>
                  <PlayIcon className='size-3' />
                  Run workflow
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={startRename}>
                <PencilIcon className='size-3' />
                Rename workflow
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onDelete}>
                <Trash2Icon className='size-3' />
                Delete workflow
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      )}
    />
  );
}
