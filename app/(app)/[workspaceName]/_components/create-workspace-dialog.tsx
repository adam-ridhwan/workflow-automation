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
import { slugify } from '@/lib/slugify';
import {
  validateWorkspaceName,
  WORKSPACE_NAME_REQUIREMENTS,
} from '@/lib/validate-workspace-name';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

type CreateWorkspaceDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function CreateWorkspaceDialog({
  open,
  onOpenChange,
}: CreateWorkspaceDialogProps) {
  const createWorkspace = useMutation(api.workspaces.create);
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
    const name = slugify(String(formData.get('workspace') ?? ''));

    if (!validateWorkspaceName(name)) {
      setError(WORKSPACE_NAME_REQUIREMENTS);
      return;
    }

    setSubmitting(true);
    try {
      await createWorkspace({ name });
      handleOpenChange(false);
      router.push(`/${encodeURIComponent(name)}`);
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not create workspace. Please try again.');
      }
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className='sm:max-w-sm'>
        <DialogHeader>
          <DialogTitle>Create a workspace</DialogTitle>
          <DialogDescription>
            Your workspace is where your workflows live.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className='flex flex-col gap-6'>
          <Field>
            <FieldLabel htmlFor='workspace'>Workspace name</FieldLabel>
            <Input
              id='workspace'
              name='workspace'
              type='text'
              placeholder='AcmeInc'
              aria-invalid={error ? true : undefined}
              required
            />
            <FieldDescription className={error ? 'text-destructive' : ''}>
              {error ?? WORKSPACE_NAME_REQUIREMENTS}
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
              {submitting ? 'Creating…' : 'Create workspace'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
