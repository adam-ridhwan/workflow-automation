'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

type WorkspaceNameFormProps = {
  workspaceName: string;
  isAdmin: boolean;
};

export function WorkspaceNameForm({
  workspaceName,
  isAdmin,
}: WorkspaceNameFormProps) {
  const renameWorkspace = useMutation(api.workspaces.rename);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = String(formData.get('name') ?? '').trim();
    if (name === workspaceName) {
      return;
    }

    setSaving(true);
    try {
      const newName = await renameWorkspace({ workspaceName, name });
      router.push(`/${encodeURIComponent(newName)}/settings/workspace`);
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Could not rename workspace. Please try again.');
      }
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
      <Field>
        <FieldLabel htmlFor='workspace-name'>Workspace name</FieldLabel>
        <Input
          id='workspace-name'
          name='name'
          type='text'
          defaultValue={workspaceName}
          disabled={!isAdmin}
          aria-invalid={error ? true : undefined}
          className='max-w-sm'
          required
        />
        <FieldDescription>
          Letters and numbers only. Spaces are replaced with dashes.
        </FieldDescription>
        {error && (
          <FieldDescription className='text-destructive'>
            {error}
          </FieldDescription>
        )}
      </Field>
      <Button
        type='submit'
        size='sm'
        className='w-fit'
        disabled={!isAdmin || saving}
      >
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
