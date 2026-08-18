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
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

type DangerZoneProps = {
  workspaceId: Id<'workspaces'>;
  workspaceName: string;
  isOwner: boolean;
};

export function DangerZone({
  workspaceId,
  workspaceName,
  isOwner,
}: DangerZoneProps) {
  const removeWorkspace = useMutation(api.workspaces.remove);
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  const [deleting, setDeleting] = useState(false);

  const confirmed = confirmText === workspaceName;

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setConfirmText('');
    }
    setOpen(nextOpen);
  }

  async function handleDelete() {
    if (!confirmed) {
      return;
    }
    setDeleting(true);
    try {
      await removeWorkspace({ workspaceId });
      router.push('/');
    } catch {
      setDeleting(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <h2 className='text-destructive text-sm font-semibold'>Danger zone</h2>
      <div
        className='border-destructive/40 flex items-center justify-between gap-4
          rounded-lg border p-4'
      >
        <div className='flex flex-col gap-0.5'>
          <span className='text-sm font-medium'>Delete this workspace</span>
          <span className='text-muted-foreground text-[13px]'>
            Permanently deletes {workspaceName}, its workflows, and all member
            access. This cannot be undone.
          </span>
        </div>
        <AlertDialog open={open} onOpenChange={handleOpenChange}>
          <AlertDialogTrigger
            render={
              <Button
                type='button'
                variant='destructive'
                size='sm'
                disabled={!isOwner || deleting}
              />
            }
          >
            {deleting ? 'Deleting…' : 'Delete workspace'}
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {workspaceName}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently deletes the workspace, its workflows, and all
                member access. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Field>
              <FieldLabel htmlFor='confirm-workspace-name'>
                Type <span className='font-semibold'>{workspaceName}</span> to
                confirm
              </FieldLabel>
              <Input
                id='confirm-workspace-name'
                type='text'
                autoComplete='off'
                value={confirmText}
                onChange={(e) => {
                  setConfirmText(e.target.value);
                }}
              />
            </Field>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDelete}
                disabled={!confirmed || deleting}
                className='bg-destructive hover:bg-destructive/90 text-white'
              >
                {deleting ? 'Deleting…' : 'Delete workspace'}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
