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
import {
  Avatar,
  AvatarFallback,
  AvatarGroup,
  AvatarGroupCount,
  AvatarImage,
} from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { getInitials } from '@/lib/get-initials';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  ChevronDownIcon,
  LogOutIcon,
  PlusIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../_hooks/use-workspace-params';
import { AddMemberDialog } from './add-member-dialog';

import type { Id } from '@/convex/_generated/dataModel';
import type { WorkspaceMember } from '@/convex/workspaces';

type CollaboratorsMenuProps = {
  members: WorkspaceMember[];
  currentUserId: Id<'users'> | null;
  adminId: Id<'users'> | null;
  workspaceName: string;
};

const MAX_VISIBLE_AVATARS = 4;

/** A destructive member action pending a confirmation dialog. */
type PendingAction =
  | { kind: 'remove'; userId: Id<'users'>; name: string }
  | { kind: 'leave' };

/** Confirmation-dialog copy for a pending action, or null when none is open. */
function pendingCopy(pending: PendingAction | null) {
  switch (pending?.kind) {
    case 'remove':
      return {
        title: `Remove ${pending.name}?`,
        description: `${pending.name} will lose access to this workspace. You can add them again later.`,
        action: 'Remove',
        destructive: true,
      };

    case 'leave':
      return {
        title: 'Leave this workspace?',
        description:
          "You'll lose access to this workspace. An admin will need to add you again.",
        action: 'Leave',
        destructive: true,
      };

    default:
      return null;
  }
}

export function CollaboratorsMenu({
  members,
  currentUserId,
  adminId,
  workspaceName,
}: CollaboratorsMenuProps) {
  const { workspaceId } = useWorkspaceParams();
  const router = useRouter();
  const setMemberRole = useMutation(api.workspaces.setMemberRole);
  const removeMember = useMutation(api.workspaces.removeMember);
  const leaveWorkspace = useMutation(api.workspaces.leave);
  const [showAddDialog, setShowAddDialog] = useState(false);
  /** A destructive action awaiting confirmation, or null when none is open. */
  const [pending, setPending] = useState<PendingAction | null>(null);
  const [busy, setBusy] = useState(false);

  // Only the workspace owner may change roles, and never the owner's own row.
  const canManageRoles = currentUserId !== null && currentUserId === adminId;
  // A non-owner member can remove themselves from the workspace.
  const canLeave =
    currentUserId !== null &&
    currentUserId !== adminId &&
    members.some((member) => member.userId === currentUserId);

  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = members.length - visibleMembers.length;

  async function changeRole(userId: Id<'users'>, role: 'editor' | 'viewer') {
    try {
      await setMemberRole({ workspaceId, userId, role });
      // The member list is fetched server-side; refresh to pick up the change.
      router.refresh();
    } catch (err) {
      toast.add({
        type: 'error',
        title:
          err instanceof ConvexError && typeof err.data === 'string'
            ? err.data
            : 'Could not update role.',
      });
    }
  }

  async function runPending() {
    if (pending === null) {
      return;
    }
    setBusy(true);
    try {
      switch (pending.kind) {
        case 'remove':
          await removeMember({ workspaceId, userId: pending.userId });
          break;

        case 'leave':
          await leaveWorkspace({ workspaceId });
          break;
      }
      setPending(null);
      // Leaving revokes your own access, so send yourself home; otherwise just
      // refresh the server-rendered member list.
      if (pending.kind === 'leave') {
        router.push('/');
      } else {
        router.refresh();
      }
    } catch (err) {
      toast.add({
        type: 'error',
        title:
          err instanceof ConvexError && typeof err.data === 'string'
            ? err.data
            : 'Something went wrong.',
      });
    } finally {
      setBusy(false);
    }
  }

  const confirmCopy = pendingCopy(pending);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title='Collaborators'
        render={<Button variant='ghost' className='h-10 px-2' />}
      >
        <AvatarGroup>
          {visibleMembers.map((member) => (
            <Avatar key={member.userId} title={member.name}>
              {member.imageUrl && (
                <AvatarImage src={member.imageUrl} alt={member.name} />
              )}
              <AvatarFallback className='text-md font-semibold'>
                {getInitials(member.name)}
              </AvatarFallback>
            </Avatar>
          ))}
          {overflowCount > 0 && (
            <AvatarGroupCount className='text-md size-6 font-semibold'>
              +{overflowCount}
            </AvatarGroupCount>
          )}
        </AvatarGroup>
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' sideOffset={8} className='w-85 p-0'>
        <div
          className='flex items-center justify-between gap-2 px-3.5 pt-3 pb-2.5'
        >
          <span className='text-[13px] font-semibold tracking-tight'>
            Collaborators
          </span>
          <span className='text-muted-foreground text-[11.5px]'>
            {members.length} {members.length === 1 ? 'person' : 'people'}
          </span>
        </div>

        <div className='max-h-59 overflow-y-auto border-t'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead
                  className='text-muted-foreground h-7.5 px-3.5 text-[10.5px]
                    font-medium tracking-wider uppercase'
                >
                  Member
                </TableHead>
                <TableHead
                  className='text-muted-foreground h-7.5 w-28 px-3.5
                    text-[10.5px] font-medium tracking-wider whitespace-nowrap
                    uppercase'
                >
                  Role
                </TableHead>
              </TableRow>
            </TableHeader>

            <TableBody>
              {members.map((member) => {
                const editable = canManageRoles && member.userId !== adminId;
                return (
                  <TableRow key={member.userId}>
                    <TableCell className='px-3.5 py-2.5'>
                      <span className='flex min-w-0 items-center gap-2'>
                        <Avatar>
                          {member.imageUrl && (
                            <AvatarImage
                              src={member.imageUrl}
                              alt={member.name}
                            />
                          )}
                          <AvatarFallback className='text-md font-semibold'>
                            {getInitials(member.name)}
                          </AvatarFallback>
                        </Avatar>
                        <span className='flex min-w-0 flex-col'>
                          <span className='truncate text-[12.5px] font-medium'>
                            {member.name}
                          </span>
                          <span
                            className='text-muted-foreground truncate
                              text-[11px]'
                          >
                            {member.email}
                          </span>
                        </span>
                      </span>
                    </TableCell>

                    <TableCell
                      className='w-28 px-3.5 text-[11.5px] whitespace-nowrap'
                    >
                      {editable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                className='-ml-2 h-7 w-20 justify-between px-2
                                  text-[11.5px] font-normal capitalize'
                              />
                            }
                          >
                            {member.role}
                            <ChevronDownIcon className='size-3 shrink-0' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start' className='w-60'>
                            <DropdownMenuRadioGroup
                              value={member.role}
                              onValueChange={(value) => {
                                void changeRole(
                                  member.userId,
                                  value as 'editor' | 'viewer'
                                );
                              }}
                            >
                              <DropdownMenuRadioItem value='editor'>
                                Editor
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value='viewer'>
                                Viewer
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>

                            <DropdownMenuSeparator />

                            <DropdownMenuItem
                              variant='destructive'
                              onClick={() => {
                                setPending({
                                  kind: 'remove',
                                  userId: member.userId,
                                  name: member.name,
                                });
                              }}
                            >
                              <Trash2Icon className='size-3.5 shrink-0' />
                              Remove from workspace
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className='text-muted-foreground capitalize'>
                          {member.userId === adminId ? 'Owner' : member.role}
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>

        <DropdownMenuItem
          onClick={() => {
            setShowAddDialog(true);
          }}
          className='h-10 cursor-pointer gap-2 rounded-none border-t px-3.5
            text-[12.5px] font-medium'
        >
          <PlusIcon className='size-3.5 shrink-0' />
          Add member
        </DropdownMenuItem>

        {canLeave && (
          <DropdownMenuItem
            variant='destructive'
            onClick={() => {
              setPending({ kind: 'leave' });
            }}
            className='h-10 cursor-pointer gap-2 rounded-none border-t px-3.5
              text-[12.5px] font-medium'
          >
            <LogOutIcon className='size-3.5 shrink-0' />
            Leave workspace
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>

      <AddMemberDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        workspaceName={workspaceName}
      />

      <AlertDialog
        open={pending !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPending(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirmCopy?.title}</AlertDialogTitle>
            <AlertDialogDescription>
              {confirmCopy?.description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                // Keep the dialog mounted through the async call; close on done.
                e.preventDefault();
                void runPending();
              }}
              disabled={busy}
              className={
                confirmCopy?.destructive
                  ? 'bg-destructive hover:bg-destructive/90 text-white'
                  : undefined
              }
            >
              {busy ? 'Working…' : confirmCopy?.action}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </DropdownMenu>
  );
}
