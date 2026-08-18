'use client';

import { useState } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/cn';
import { ChevronsUpDownIcon, PlusIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';

import { CreateWorkspaceDialog } from './create-workspace-dialog';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workspace } from '@/convex/workspaces';

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
};

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const params = useParams<{ workspaceId: Id<'workspaces'> }>();
  const currentWorkspaceId = params.workspaceId;
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const activeWorkspace =
    workspaces.find((workspace) => workspace._id === currentWorkspaceId) ??
    workspaces[0];

  if (!activeWorkspace) {
    return null;
  }

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size='lg'
                className='data-open:bg-sidebar-accent
                  data-open:text-sidebar-accent-foreground'
              />
            }
          >
            <Avatar className='rounded-lg after:rounded-lg'>
              {activeWorkspace.imageUrl && (
                <AvatarImage
                  src={activeWorkspace.imageUrl}
                  alt={activeWorkspace.name}
                  className='rounded-lg'
                />
              )}
              <AvatarFallback
                className='bg-sidebar-primary text-sidebar-primary-foreground
                  rounded-lg'
              >
                {activeWorkspace.name.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className='grid flex-1 text-left text-sm leading-tight'>
              <span className='truncate font-medium'>
                {activeWorkspace.name}
              </span>
            </div>
            <ChevronsUpDownIcon className='ml-auto' />
          </DropdownMenuTrigger>

          <DropdownMenuContent align='start' side='bottom' sideOffset={8}>
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Workspaces
              </DropdownMenuLabel>

              {workspaces.map((workspace) => {
                const isActive = workspace._id === activeWorkspace._id;
                return (
                  <DropdownMenuItem
                    key={workspace._id}
                    onClick={() => {
                      router.push(`/workspace/${workspace._id}`);
                    }}
                    className={cn('gap-2 p-2', isActive && 'bg-secondary')}
                  >
                    <Avatar
                      size='sm'
                      className={cn(
                        'overflow-hidden rounded-md border after:hidden'
                      )}
                    >
                      {workspace.imageUrl && (
                        <AvatarImage
                          src={workspace.imageUrl}
                          alt={workspace.name}
                          className='rounded-none'
                        />
                      )}
                      <AvatarFallback
                        className={cn(
                          'rounded-none bg-transparent text-inherit',
                          isActive && 'bg-primary text-primary-foreground!'
                        )}
                      >
                        {workspace.name.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    {workspace.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={
                  <Link href={`/workspace/${activeWorkspace._id}/settings`} />
                }
                nativeButton={false}
                className='gap-2 p-2'
              >
                <div
                  className='flex size-6 items-center justify-center rounded-md
                    border bg-transparent'
                >
                  <Settings className='size-3.5' />
                </div>

                <div className='font-medium'>Workspace settings</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuItem
                className='gap-2 p-2'
                onClick={() => {
                  setShowCreateDialog(true);
                }}
              >
                <div
                  className='flex size-6 items-center justify-center rounded-md
                    border bg-transparent'
                >
                  <PlusIcon className='size-4' />
                </div>

                <div className='font-medium'>Add workspace</div>
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <CreateWorkspaceDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
