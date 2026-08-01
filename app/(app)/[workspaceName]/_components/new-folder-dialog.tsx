'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useWorkspaceName } from '@/hooks/use-workspace-name';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

import type { Folder } from '@/convex/folders';

type NewFolderDialogProps = {
  parentId?: Folder['_id'];
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewFolderDialog({
  parentId,
  open,
  onOpenChange,
}: NewFolderDialogProps) {
  const workspaceName = useWorkspaceName();
  const createFolder = useMutation(api.folders.create);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      setError(null);
      setSubmitting(false);
    }
    onOpenChange(nextOpen);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const name = String(formData.get('name') ?? '').trim();

    setSubmitting(true);
    try {
      await createFolder({ workspaceName, name, parentId });
      handleOpenChange(false);
      // The folders table is fetched server-side; refresh to pick it up.
      router.refresh();
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not create folder. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>New folder</DialogTitle>
          <DialogDescription>
            Folders keep your workspace files organized.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel htmlFor='folder-name'>Name</FieldLabel>
            <Input
              id='folder-name'
              name='name'
              type='text'
              placeholder='Invoices'
              aria-invalid={error ? true : undefined}
              required
            />
            {error && (
              <FieldDescription className='text-destructive'>
                {error}
              </FieldDescription>
            )}
          </Field>
          <DialogFooter>
            <Button
              type='button'
              variant='outline'
              onClick={() => handleOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? 'Creating…' : 'Create folder'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
