'use client';

import { useState } from 'react';
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
import { ChevronDownIcon, PlusIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../_hooks/use-workspace-params';
import { AddMemberDialog } from './add-member-dialog';

import type { Id } from '@/convex/_generated/dataModel';
import type { WorkspaceMember } from '@/convex/workspaces';

type CollaboratorsMenuProps = {
  members: WorkspaceMember[];
  currentUserId: Id<'users'> | null;
  adminId: Id<'users'> | null;
};

const MAX_VISIBLE_AVATARS = 4;

export function CollaboratorsMenu({
  members,
  currentUserId,
  adminId,
}: CollaboratorsMenuProps) {
  const { workspaceId } = useWorkspaceParams();
  const router = useRouter();
  const setMemberRole = useMutation(api.workspaces.setMemberRole);
  const [showAddDialog, setShowAddDialog] = useState(false);

  // Only the workspace owner may change roles, and never the owner's own row.
  const canManageRoles = currentUserId !== null && currentUserId === adminId;

  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = members.length - visibleMembers.length;

  async function changeRole(
    userId: Id<'users'>,
    role: 'collaborator' | 'viewer'
  ) {
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
                  className='text-muted-foreground h-7.5 w-22.5 px-3.5
                    text-[10.5px] font-medium tracking-wider uppercase'
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

                    <TableCell className='px-3.5 text-[11.5px]'>
                      {editable ? (
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button
                                variant='ghost'
                                className='-ml-2 h-7 gap-1 px-2 text-[11.5px]
                                  font-normal capitalize'
                              />
                            }
                          >
                            {member.role}
                            <ChevronDownIcon className='size-3 shrink-0' />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align='start'>
                            <DropdownMenuRadioGroup
                              value={member.role}
                              onValueChange={(value) => {
                                void changeRole(
                                  member.userId,
                                  value as 'collaborator' | 'viewer'
                                );
                              }}
                            >
                              <DropdownMenuRadioItem value='collaborator'>
                                Collaborator
                              </DropdownMenuRadioItem>
                              <DropdownMenuRadioItem value='viewer'>
                                Viewer
                              </DropdownMenuRadioItem>
                            </DropdownMenuRadioGroup>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      ) : (
                        <span className='text-muted-foreground capitalize'>
                          {member.role}
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
      </DropdownMenuContent>

      <AddMemberDialog open={showAddDialog} onOpenChange={setShowAddDialog} />
    </DropdownMenu>
  );
}
