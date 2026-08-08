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
import { api } from '@/convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  CopyIcon,
  EllipsisVerticalIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';
import { RenameWorkflowDialog } from './rename-workflow-dialog';
import { WorkflowDeleteDialog } from './workflow-delete-dialog';

/** The "more actions" (⋯) header menu: rename, duplicate, or delete the
 * current workflow. */
export function WorkflowMoreMenu() {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const workflow = useQuery(api.workflows.get, { workspaceName, workflowId });
  const duplicateWorkflow = useMutation(api.workflows.duplicate);
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const name = workflow?.name ?? '';

  async function handleDuplicate() {
    try {
      const newWorkflowId = await duplicateWorkflow({
        workspaceName,
        workflowId,
      });
      toast.add({ type: 'success', title: 'Workflow duplicated.' });
      router.push(
        `/${encodeURIComponent(workspaceName)}/workflow/${newWorkflowId}/canvas`
      );
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof ConvexError && typeof error.data === 'string'
            ? error.data
            : 'Could not duplicate the workflow. Please try again.',
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon' aria-label='More actions' />
          }
        >
          <EllipsisVerticalIcon className='size-4' />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-32'>
          <DropdownMenuItem
            onClick={() => {
              setRenameOpen(true);
            }}
          >
            <PencilIcon className='size-3' />
            Rename
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon className='size-3' />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setDeleteOpen(true);
            }}
          >
            <Trash2Icon className='size-3' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RenameWorkflowDialog
        currentName={name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <WorkflowDeleteDialog
        name={name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
