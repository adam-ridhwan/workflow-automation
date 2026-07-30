'use client';

import { useState } from 'react';
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
import { ChevronDownIcon, PlusIcon } from 'lucide-react';

import { AddMemberDialog } from './add-member-dialog';

import type { WorkspaceMember } from '@/convex/workspaces';

type CollaboratorsMenuProps = {
  workspaceName: string;
  members: WorkspaceMember[];
};

export function CollaboratorsMenu({
  workspaceName,
  members,
}: CollaboratorsMenuProps) {
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        title='Collaborators'
        className='hover:bg-accent data-open:bg-accent flex h-8 items-center
          rounded-full pr-2 pl-3.5'
      >
        {members.map((member) => (
          <span
            key={member.userId}
            title={member.name}
            className='bg-muted border-background text-muted-foreground -ml-1.5
              flex size-[26px] items-center justify-center rounded-full border-2
              text-[10px] font-semibold'
          >
            {getInitials(member.name)}
          </span>
        ))}
      </DropdownMenuTrigger>

      <DropdownMenuContent align='end' sideOffset={8} className='w-[340px] p-0'>
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

        <div className='max-h-[236px] overflow-y-auto border-t'>
          <Table>
            <TableHeader>
              <TableRow className='hover:bg-transparent'>
                <TableHead
                  className='text-muted-foreground h-[30px] px-3.5 text-[10.5px]
                    font-medium tracking-wider uppercase'
                >
                  Member
                </TableHead>
                <TableHead
                  className='text-muted-foreground h-[30px] w-[90px] px-3.5
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
                      <span
                        className='bg-muted text-muted-foreground flex
                          size-[26px] shrink-0 items-center justify-center
                          rounded-full border text-[10px] font-semibold'
                      >
                        {getInitials(member.name)}
                      </span>
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
          className='h-10 gap-2 rounded-none px-3.5 text-[12.5px] font-medium'
        >
          <PlusIcon className='size-3.5 shrink-0' />
          Add member
        </DropdownMenuItem>
      </DropdownMenuContent>

      <AddMemberDialog
        workspaceName={workspaceName}
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
      />
    </DropdownMenu>
  );
}
