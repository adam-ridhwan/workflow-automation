'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { Field, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { formatTime } from '@/lib/format-time';
import { PROVIDER_SECRETS, providerSecretLabel } from '@/lib/provider-secrets';
import { useMutation, useQuery } from 'convex/react';
import { KeyRoundIcon, Loader2Icon, Trash2Icon } from 'lucide-react';

import type { Id } from '@/convex/_generated/dataModel';

type SecretsManagerProps = {
  workspaceId: Id<'workspaces'>;
};

export function SecretsManager({ workspaceId }: SecretsManagerProps) {
  const secrets = useQuery(api.secrets.list, { workspaceId });
  const setSecret = useMutation(api.secrets.set);
  const removeSecret = useMutation(api.secrets.remove);

  const [name, setName] = useState<string | null>(null);
  const [value, setValue] = useState('');
  const [saving, setSaving] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  /** The secret name pending delete-confirmation, or null when closed. */
  const [confirmName, setConfirmName] = useState<string | null>(null);

  // Only offer providers that don't already have a key stored.
  const existingNames = new Set((secrets ?? []).map((secret) => secret.name));
  const available = PROVIDER_SECRETS.filter(
    (secret) => !existingNames.has(secret.name)
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (name === null || value === '') {
      return;
    }
    setSaving(true);
    try {
      await setSecret({ workspaceId, name, value });
      setName(null);
      setValue('');
      toast.add({ type: 'success', title: 'Secret saved.' });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(secretName: string) {
    setConfirmName(null);
    setRemoving(secretName);
    try {
      await removeSecret({ workspaceId, name: secretName });
      toast.add({ type: 'success', title: 'Secret removed.' });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setRemoving(null);
    }
  }

  return (
    <div className='flex flex-col gap-8'>
      {/* Add / replace a secret. */}
      <form onSubmit={handleSubmit} className='flex flex-col gap-3'>
        <div className='flex flex-col gap-3 sm:flex-row sm:items-end'>
          <Field className='sm:max-w-72'>
            <FieldLabel htmlFor='secret-name'>Provider key</FieldLabel>
            <Select
              value={name}
              disabled={available.length === 0}
              onValueChange={setName}
            >
              <SelectTrigger id='secret-name' className='w-full'>
                <SelectValue
                  placeholder={
                    available.length === 0
                      ? 'All provider keys are set'
                      : 'Select a provider'
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {available.map((secret) => (
                  <SelectItem key={secret.name} value={secret.name}>
                    {secret.label} — {secret.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field className='flex-1'>
            <FieldLabel htmlFor='secret-value'>Value</FieldLabel>
            <Input
              id='secret-value'
              type='password'
              value={value}
              placeholder='sk-…'
              autoComplete='off'
              spellCheck={false}
              onChange={(e) => {
                setValue(e.target.value);
              }}
              required
            />
          </Field>
          <Button
            type='submit'
            size='sm'
            disabled={saving || name === null || value === ''}
          >
            {saving ? 'Saving…' : 'Add secret'}
          </Button>
        </div>
        <p className='text-muted-foreground text-[13px]'>
          Choose the provider whose API key you&apos;re adding. Saving a key for
          a provider that already has one replaces it.
        </p>
      </form>

      {/* Existing secrets. */}
      {renderSecrets()}

      <AlertDialog
        open={confirmName !== null}
        onOpenChange={(open) => {
          if (!open) {
            setConfirmName(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this secret?</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmName !== null && (
                <>
                  <span className='font-medium'>
                    {providerSecretLabel(confirmName)}
                  </span>{' '}
                  will be permanently deleted. Workflows that rely on it will
                  stop running until you add it again.
                </>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className='bg-destructive hover:bg-destructive/90 text-white'
              onClick={() => {
                if (confirmName !== null) {
                  handleRemove(confirmName);
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );

  function renderSecrets() {
    if (secrets === undefined) {
      return (
        <div className='text-muted-foreground flex items-center gap-2 text-sm'>
          <Loader2Icon className='size-4 animate-spin' />
          Loading…
        </div>
      );
    }
    if (secrets.length === 0) {
      return (
        <Empty className='border'>
          <EmptyHeader>
            <EmptyMedia variant='icon'>
              <KeyRoundIcon />
            </EmptyMedia>
            <EmptyTitle>No secrets yet</EmptyTitle>
            <EmptyDescription>
              Add an API key above to make it available to this workspace&apos;s
              workflows.
            </EmptyDescription>
          </EmptyHeader>
        </Empty>
      );
    }
    return (
      <ul className='overflow-hidden rounded-lg border'>
        {secrets.map((secret) => (
          <li
            key={secret._id}
            className='flex items-center gap-3 px-3 py-2.5 not-last:border-b'
          >
            <KeyRoundIcon className='text-muted-foreground size-4 shrink-0' />
            <div className='min-w-0 flex-1'>
              <p className='truncate text-[13px] font-medium'>
                {providerSecretLabel(secret.name)}
              </p>
              <p className='text-muted-foreground text-[11px]'>
                ••••{secret.last4} · updated {formatTime(secret.updatedAt)}
              </p>
            </div>
            <Button
              variant='ghost'
              size='icon-sm'
              aria-label={`Remove ${secret.name}`}
              disabled={removing === secret.name}
              onClick={() => {
                setConfirmName(secret.name);
              }}
            >
              {removing === secret.name ? (
                <Loader2Icon className='animate-spin' />
              ) : (
                <Trash2Icon />
              )}
            </Button>
          </li>
        ))}
      </ul>
    );
  }
}
