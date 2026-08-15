'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';

type PageRenameDialogProps = {
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function PageRenameDialog({
  currentName,
  open,
  onOpenChange,
}: PageRenameDialogProps) {
  const { workspaceName, pageId } = useWorkspaceParams();
  const renamePage = useMutation(api.pages.rename);
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the field to the latest name whenever the dialog opens, tracked during
  // render (avoids a cascading effect re-render).
  const [wasOpen, setWasOpen] = useState(open);
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setName(currentName);
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Page name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await renamePage({ workspaceName, pageId, name: trimmed });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(errorMessage(err, 'Could not rename page. Please try again.'));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Rename page</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel htmlFor='rename-page-name'>Name</FieldLabel>
            <Input
              id='rename-page-name'
              name='name'
              type='text'
              value={name}
              onChange={(e) => {
                setName(e.target.value);
              }}
              aria-invalid={error ? true : undefined}
              autoFocus
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
              onClick={() => {
                onOpenChange(false);
              }}
            >
              Cancel
            </Button>
            <Button type='submit' disabled={submitting}>
              {submitting ? 'Saving…' : 'Save'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
