'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Field, FieldDescription, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

type AccountNameFormProps = {
  name: string;
};

export function AccountNameForm({ name }: AccountNameFormProps) {
  const updateName = useMutation(api.users.updateName);
  const router = useRouter();
  const [value, setValue] = useState(name);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);

    const nextName = value.trim();
    if (nextName === name) {
      return;
    }

    setSaving(true);
    try {
      await updateName({ name: nextName });
      router.refresh();
    } catch (err) {
      setError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not update your name. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
      <Field>
        <FieldLabel htmlFor='account-name'>Name</FieldLabel>
        <Input
          id='account-name'
          name='name'
          type='text'
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
          }}
          aria-invalid={error ? true : undefined}
          className='max-w-sm'
          required
        />
        {error && (
          <FieldDescription className='text-destructive'>
            {error}
          </FieldDescription>
        )}
      </Field>
      <Button type='submit' size='sm' className='w-fit' disabled={saving}>
        {saving ? 'Saving…' : 'Save'}
      </Button>
    </form>
  );
}
