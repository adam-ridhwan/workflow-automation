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

import { useWorkspaceParams } from '../_hooks/use-workspace-params';

type AddMemberDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function AddMemberDialog({ open, onOpenChange }: AddMemberDialogProps) {
  const { workspaceName } = useWorkspaceParams();
  const addMember = useMutation(api.workspaces.addMember);
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

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = String(formData.get('email') ?? '').trim();

    setSubmitting(true);
    try {
      await addMember({ workspaceName, email });
      handleOpenChange(false);
      // The member list is fetched server-side; refresh to pick it up.
      router.refresh();
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not add member. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Add member</DialogTitle>
          <DialogDescription>
            Add a collaborator to {workspaceName} by email.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <Field>
            <FieldLabel htmlFor='member-email'>Email</FieldLabel>
            <Input
              id='member-email'
              name='email'
              type='email'
              autoComplete='off'
              placeholder='m@example.com'
              aria-invalid={error ? true : undefined}
              required
            />
            <FieldDescription className={error ? 'text-destructive' : ''}>
              {error ?? 'They must already have an account.'}
            </FieldDescription>
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
              {submitting ? 'Adding…' : 'Add member'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
