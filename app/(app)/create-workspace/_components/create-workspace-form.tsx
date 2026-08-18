'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
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

export function CreateWorkspaceForm() {
  const createWorkspace = useMutation(api.workspaces.create);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const formData = new FormData(e.currentTarget);
    const name = slugify(String(formData.get('workspace') ?? ''));

    if (!validateWorkspaceName(name)) {
      setError(WORKSPACE_NAME_REQUIREMENTS);
      return;
    }

    setSubmitting(true);
    try {
      const workspaceId = await createWorkspace({ name });
      router.replace(`/workspace/${workspaceId}`);
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
    <Card>
      <CardHeader className='text-center'>
        <CardTitle className='text-xl'>Create your workspace</CardTitle>
        <CardDescription>
          Your workspace is where your workflows live.
        </CardDescription>
      </CardHeader>
      <CardContent>
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
          <Button type='submit' disabled={submitting}>
            {submitting ? 'Creating…' : 'Create workspace'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
