'use client';

import { useEffect, useState } from 'react';
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
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

type RenameWorkflowDialogProps = {
  currentName: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function RenameWorkflowDialog({
  currentName,
  open,
  onOpenChange,
}: RenameWorkflowDialogProps) {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const renameWorkflow = useMutation(api.workflows.rename);
  const router = useRouter();
  const [name, setName] = useState(currentName);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Reset the field to the latest name whenever the dialog opens.
  useEffect(() => {
    if (open) {
      setName(currentName);
      setError(null);
    }
  }, [open, currentName]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = name.trim();
    if (trimmed.length === 0) {
      setError('Workflow name is required.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await renameWorkflow({ workspaceName, workflowId, name: trimmed });
      onOpenChange(false);
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not rename workflow. Please try again.'
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className='sm:max-w-md'>
        <DialogHeader>
          <DialogTitle>Rename workflow</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-5'>
          <Field>
            <FieldLabel htmlFor='rename-workflow-name'>Name</FieldLabel>
            <Input
              id='rename-workflow-name'
              name='name'
              type='text'
              value={name}
              onChange={(event) => {
                setName(event.target.value);
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
