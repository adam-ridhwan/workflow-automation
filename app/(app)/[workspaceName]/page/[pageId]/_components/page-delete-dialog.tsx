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

import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';

type PageDeleteDialogProps = {
  name: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

/** Deletes the current page, then leaves for the pages list — the builder can't
 * stay open on a page that no longer exists. */
export function PageDeleteDialog({
  name,
  open,
  onOpenChange,
}: PageDeleteDialogProps) {
  const { workspaceName, pageId } = useWorkspaceParams();
  const removePage = useMutation(api.pages.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    setDeleting(true);
    try {
      await removePage({ workspaceName, pageId });
      router.push(`/${encodeURIComponent(workspaceName)}/pages`);
    } catch {
      toast.add({
        type: 'error',
        title: 'Could not delete the page. Please try again.',
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
            This permanently deletes the page. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            {deleting ? 'Deleting…' : 'Delete page'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
