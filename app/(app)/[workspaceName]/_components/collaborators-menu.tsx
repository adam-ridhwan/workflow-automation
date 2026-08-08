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
import { getInitials } from '@/lib/get-initials';
import { PlusIcon } from 'lucide-react';

import { AddMemberDialog } from './add-member-dialog';

import type { WorkspaceMember } from '@/convex/workspaces';

type CollaboratorsMenuProps = {
  members: WorkspaceMember[];
};

const MAX_VISIBLE_AVATARS = 4;

export function CollaboratorsMenu({ members }: CollaboratorsMenuProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  const visibleMembers = members.slice(0, MAX_VISIBLE_AVATARS);
  const overflowCount = members.length - visibleMembers.length;

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
              {members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell className='px-3.5 py-2.5'>
                    <span className='flex min-w-0 items-center gap-2'>
                      <Avatar>
                        {member.imageUrl && (
                          <AvatarImage src={member.imageUrl} alt={member.name} />
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
                          className='text-muted-foreground truncate text-[11px]'
                        >
                          {member.email}
                        </span>
                      </span>
                    </span>
                  </TableCell>

                  <TableCell
                    className='text-muted-foreground px-3.5 text-[11.5px]
                      capitalize'
                  >
                    {member.role}
                  </TableCell>
                </TableRow>
              ))}
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
