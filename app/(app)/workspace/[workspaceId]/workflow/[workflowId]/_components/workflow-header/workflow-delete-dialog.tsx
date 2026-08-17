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
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

type WorkflowDeleteDialogProps = {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Deletes the current workflow, then leaves for the workflows list — the
 * detail page can't stay open on a workflow that no longer exists. */
export function WorkflowDeleteDialog({
  name,
  open,
  onOpenChange,
}: WorkflowDeleteDialogProps) {
  const { workspaceId, workflowId } = useWorkspaceParams();
  const removeWorkflow = useMutation(api.workflows.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await removeWorkflow({ workspaceId, workflowId });
      router.push(`/workspace/${workspaceId}/workflows`);
    } catch {
      toast.add({
        type: 'error',
        title: 'Could not delete the workflow. Please try again.',
      });
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {name}?</AlertDialogTitle>
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
