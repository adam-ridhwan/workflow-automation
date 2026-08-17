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
import { useMutation, useQuery } from 'convex/react';
import { ConvexError } from 'convex/values';
import { ArrowLeftIcon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function CreateWorkspaceForm() {
  const createWorkspace = useMutation(api.workspaces.create);
  const workspaces = useQuery(api.workspaces.list);
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const firstWorkspace = workspaces?.[0];

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
      router.push(`/workspace/${workspaceId}`);
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
          {firstWorkspace && (
            <Link
              href={`/workspace/${firstWorkspace._id}`}
              className='text-muted-foreground hover:text-foreground flex
                items-center justify-center gap-1 text-sm underline-offset-4
                hover:underline'
            >
              <ArrowLeftIcon className='size-3.5' />
              Back to {firstWorkspace.name}
            </Link>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
