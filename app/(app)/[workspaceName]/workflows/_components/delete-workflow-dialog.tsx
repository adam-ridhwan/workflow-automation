'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

import { useWorkspaceName } from '../../_hooks/use-workspace-name';

import type { Workflow } from '@/convex/workflows';

type DeleteWorkflowDialogProps = {
  workflow: Workflow | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteWorkflowDialog({
  workflow,
  onOpenChange,
}: DeleteWorkflowDialogProps) {
  const workspaceName = useWorkspaceName();
  const removeWorkflow = useMutation(api.workflows.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!workflow) {
      return;
    }
    setDeleting(true);
    try {
      await removeWorkflow({ workspaceName, workflowId: workflow._id });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={workflow !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {workflow?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the workflow. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            {deleting ? 'Deleting…' : 'Delete workflow'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
