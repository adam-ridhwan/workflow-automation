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

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Page } from '@/convex/pages';

type DeletePageDialogProps = {
  page: Page | null;
  onOpenChange: (open: boolean) => void;
};

export function DeletePageDialog({
  page,
  onOpenChange,
}: DeletePageDialogProps) {
  const { workspaceId } = useWorkspaceParams();
  const removePage = useMutation(api.pages.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!page) {
      return;
    }
    setDeleting(true);
    try {
      await removePage({ workspaceId, pageId: page._id });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={page !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {page?.name}?</AlertDialogTitle>
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
