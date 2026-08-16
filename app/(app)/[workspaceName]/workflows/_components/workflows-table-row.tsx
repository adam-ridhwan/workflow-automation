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
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { formatTime } from '@/lib/format-time';
import { useAction, useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  EllipsisVerticalIcon,
  PencilIcon,
  PlayIcon,
  SquareIcon,
  Trash2Icon,
  WorkflowIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { resourceRowComposer } from '../../_components/resource-row-composer';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { WorkflowRunStateBadge } from './workflow-run-state-badge';

import type { Workflow } from '@/convex/workflows';

const WorkflowRow = resourceRowComposer<Workflow>();

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
  const router = useRouter();
  const renameWorkflow = useMutation(api.workflows.rename);
  const runWorkflow = useAction(api.runWorkflow.run);
  const stopRun = useMutation(api.runHistory.stopRun);
  // True from the click until the run finishes (or errors). Survives alongside
  // `phase` so the control stays busy even before the run doc reports 'running'.
  const [isStarting, setIsStarting] = useState(false);

  const isRunning = phase === 'running' || isStarting;
  const isScheduled = phase === 'scheduled';
  const isBusy = isRunning || isScheduled;

  // Inline-rename state, owned here and handed to the composer's NameCell.
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  function startRename() {
    setRenameError(null);
    setIsRenaming(true);
  }

  function stopRename() {
    setIsRenaming(false);
    setRenameError(null);
  }

  async function submitRename(rawName: string) {
    const nextName = rawName.trim();
    if (nextName.length === 0 || nextName === workflow.name) {
      stopRename();
      return;
    }
    try {
      await renameWorkflow({ workspaceName, workflowId: workflow._id, name: nextName });
      stopRename();
      router.refresh();
    } catch (err) {
      setRenameError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not rename workflow. Please try again.'
      );
    }
  }

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
    <WorkflowRow.Provider resource={workflow}>
      <WorkflowRow.Row
        drag={{ kind: 'workflow', id: workflow._id, name: workflow.name }}
        dragDisabled={isRenaming}
      >
        <WorkflowRow.NameCell
          icon={<WorkflowIcon className='text-muted-foreground size-4 shrink-0' />}
          name={workflow.name}
          subtitle={workflow.description}
          href={`/${encodeURIComponent(workspaceName)}/workflow/${workflow._id}/canvas`}
          isRenaming={isRenaming}
          renameError={renameError}
          onRenameSubmit={submitRename}
          onRenameCancel={stopRename}
        />

        <WorkflowRow.Cell>
          <WorkflowRunStateBadge
            phase={phase}
            isStarting={isStarting}
            isPublished={workflow.isPublished}
          />
        </WorkflowRow.Cell>

        <WorkflowRow.Cell className='text-muted-foreground text-xs'>
          {formatTime(workflow._creationTime)}
        </WorkflowRow.Cell>

        <WorkflowRow.Cell>
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
        </WorkflowRow.Cell>

        <WorkflowRow.Actions>
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
                <DropdownMenuItem
                  disabled={isBusy || !workflow.isPublished}
                  onClick={handleRun}
                >
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
        </WorkflowRow.Actions>
      </WorkflowRow.Row>
    </WorkflowRow.Provider>
  );
}
