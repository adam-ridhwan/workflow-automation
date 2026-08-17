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

import { useWorkspaceParams } from '../_hooks/use-workspace-params';

import type { Folder } from '@/convex/folders';

type DeleteFolderDialogProps = {
  folder: Folder | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFolderDialog({
  folder,
  onOpenChange,
}: DeleteFolderDialogProps) {
  const { workspaceId } = useWorkspaceParams();
  const removeFolder = useMutation(api.folders.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!folder) {
      return;
    }
    setDeleting(true);
    try {
      await removeFolder({ workspaceId, folderId: folder._id });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={folder !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {folder?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the folder and everything inside it,
            including its {folder?.kind === 'file' ? 'files' : 'workflows'} and
            subfolders. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            {deleting ? 'Deleting…' : 'Delete folder'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
