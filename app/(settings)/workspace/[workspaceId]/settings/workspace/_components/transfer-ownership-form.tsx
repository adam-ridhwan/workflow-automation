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
import { Field, FieldLabel } from '@/components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';
import type { WorkspaceMember } from '@/convex/workspaces';

type TransferOwnershipFormProps = {
  workspaceId: Id<'workspaces'>;
  /** Members eligible to receive ownership — everyone except the current owner. */
  members: WorkspaceMember[];
};

export function TransferOwnershipForm({
  workspaceId,
  members,
}: TransferOwnershipFormProps) {
  const transferOwnership = useMutation(api.workspaces.transferOwnership);
  const router = useRouter();
  const [selectedId, setSelectedId] = useState('');
  const [confirming, setConfirming] = useState(false);
  const [transferring, setTransferring] = useState(false);

  const selected = members.find((member) => member.userId === selectedId);

  async function handleTransfer() {
    if (selected === undefined) {
      return;
    }
    setTransferring(true);
    try {
      await transferOwnership({ workspaceId, userId: selected.userId });
      // You're no longer the owner, so these settings are no longer yours to
      // see — send yourself back to the workspace.
      router.push(`/workspace/${workspaceId}`);
    } catch (err) {
      toast.add({
        type: 'error',
        title:
          err instanceof ConvexError && typeof err.data === 'string'
            ? err.data
            : 'Could not transfer ownership.',
      });
      setTransferring(false);
      setConfirming(false);
    }
  }

  return (
    <div className='flex flex-col gap-3'>
      <div className='flex flex-col gap-0.5'>
        <h2 className='text-sm font-semibold'>Transfer ownership</h2>
        <span className='text-muted-foreground text-[13px]'>
          Hand this workspace to another member. They become the owner and you
          become a regular editor.
        </span>
      </div>

      {members.length === 0 ? (
        <p className='text-muted-foreground text-[13px]'>
          Add another member before you can transfer ownership.
        </p>
      ) : (
        <div className='flex items-end gap-2'>
          <Field className='max-w-xs flex-1'>
            <FieldLabel htmlFor='new-owner'>New owner</FieldLabel>
            <Select
              items={Object.fromEntries(
                members.map((member) => [member.userId, member.name])
              )}
              value={selectedId}
              onValueChange={(value) => setSelectedId(value ?? '')}
            >
              <SelectTrigger id='new-owner' className='w-full'>
                <SelectValue placeholder='Select a member' />
              </SelectTrigger>
              <SelectContent alignItemWithTrigger={false}>
                {members.map((member) => (
                  <SelectItem key={member.userId} value={member.userId}>
                    {member.name} · {member.email}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Button
            type='button'
            variant='outline'
            disabled={selected === undefined || transferring}
            onClick={() => setConfirming(true)}
          >
            Transfer
          </Button>
        </div>
      )}

      <AlertDialog open={confirming} onOpenChange={setConfirming}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Make {selected?.name} the owner?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selected?.name} becomes the workspace owner. You&apos;ll become a
              regular editor and can no longer transfer ownership or delete the
              workspace.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog mounted through the async call.
                e.preventDefault();
                void handleTransfer();
              }}
              disabled={transferring}
            >
              {transferring ? 'Transferring…' : 'Transfer ownership'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
