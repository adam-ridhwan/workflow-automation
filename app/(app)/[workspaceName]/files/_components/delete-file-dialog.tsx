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

import type { File } from '@/convex/files';

type DeleteFileDialogProps = {
  file: File | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteFileDialog({
  file,
  onOpenChange,
}: DeleteFileDialogProps) {
  const { workspaceName } = useWorkspaceParams();
  const removeFile = useMutation(api.files.remove);
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);

  async function handleDelete() {
    if (!file) {
      return;
    }
    setDeleting(true);
    try {
      await removeFile({ workspaceName, fileId: file._id });
      onOpenChange(false);
      router.refresh();
    } finally {
      setDeleting(false);
    }
  }

  return (
    <AlertDialog open={file !== null} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Delete {file?.name}?</AlertDialogTitle>
          <AlertDialogDescription>
            This permanently deletes the file. This action cannot be undone.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleting}
            className='bg-destructive hover:bg-destructive/90 text-white'
          >
            {deleting ? 'Deleting…' : 'Delete file'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
