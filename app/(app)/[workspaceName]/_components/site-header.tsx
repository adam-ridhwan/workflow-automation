'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { api } from '@/convex/_generated/api';
import { getInitials } from '@/lib/get-initials';
import { useQuery } from 'convex/react';
import { ChevronDownIcon, ChevronRightIcon, PlusIcon } from 'lucide-react';
import { useParams, usePathname } from 'next/navigation';

function sectionFromPathname(pathname: string) {
  if (pathname.endsWith('/workflows')) {
    return 'Workflows';
  }
  if (pathname.endsWith('/files')) {
    return 'Files';
  }
  return 'Overview';
}

export function SiteHeader() {
  const params = useParams<{ workspaceName: string }>();
  const workspaceName = decodeURIComponent(params.workspaceName);
  const pathname = usePathname();
  const section = sectionFromPathname(pathname);
  const members = useQuery(api.workspaces.members, { workspaceName }) ?? [];

  return (
    <header
      className='bg-background/60 flex h-14 shrink-0 items-center
        justify-between border-b px-5 supports-backdrop-filter:backdrop-blur-xl'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2.5'>
        <SidebarTrigger className='-ml-1.5' />
        <Separator
          orientation='vertical'
          className='data-vertical:h-4.5 data-vertical:self-auto'
        />
        <span
          className='text-[15px] font-semibold tracking-tight whitespace-nowrap'
        >
          {workspaceName}
        </span>
        <ChevronRightIcon className='text-muted-foreground size-3.5 shrink-0' />
        <span className='text-muted-foreground truncate text-[13px] font-medium'>
          {section}
        </span>
      </div>

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
              className='bg-muted border-background text-muted-foreground
                -ml-1.5 flex size-[26px] items-center justify-center
                rounded-full border-2 text-[10px] font-semibold'
            >
              {getInitials(member.name)}
            </span>
          ))}
          <ChevronDownIcon className='text-muted-foreground ml-1.5 size-3.5' />
        </DropdownMenuTrigger>

        <DropdownMenuContent
          align='end'
          sideOffset={8}
          className='w-[340px] p-0'
        >
          <div
            className='flex items-center justify-between gap-2 px-3.5 pt-3
              pb-2.5'
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
                    className='text-muted-foreground h-[30px] px-3.5
                      text-[10.5px] font-medium tracking-wider uppercase'
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
                            className='text-muted-foreground truncate
                              text-[11px]'
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
          <button
            type='button'
            className='hover:bg-accent flex h-10 w-full items-center gap-2
              px-3.5 text-left text-[12.5px] font-medium'
          >
            <PlusIcon className='size-3.5 shrink-0' />
            Invite people
          </button>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  );
}
