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
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

type NewWorkflowDialogProps = {
  workspaceName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function NewWorkflowDialog({
  workspaceName,
  open,
  onOpenChange,
}: NewWorkflowDialogProps) {
  const createWorkflow = useMutation(api.queries.workflows.create);
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
    const description = String(formData.get('description') ?? '').trim();

    setSubmitting(true);
    try {
      await createWorkflow({
        workspaceName,
        name,
        description: description ? description : undefined,
      });
      handleOpenChange(false);
      // The workflows table is fetched server-side; refresh to pick it up.
      router.refresh();
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not create workflow. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>New workflow</DialogTitle>
          <DialogDescription>
            Workflows start on the canvas until you publish them.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel htmlFor='workflow-name'>Name</FieldLabel>
            <Input
              id='workflow-name'
              name='name'
              type='text'
              placeholder='Invoice processing'
              aria-invalid={error ? true : undefined}
              required
            />
          </Field>
          <Field>
            <FieldLabel htmlFor='workflow-description'>Description</FieldLabel>
            <Input
              id='workflow-description'
              name='description'
              type='text'
              placeholder='What does this workflow do? (optional)'
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
              {submitting ? 'Creating…' : 'Create workflow'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
