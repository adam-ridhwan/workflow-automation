'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
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

import type { Workspace } from '@/convex/queries/workspaces';

type WorkspaceSwitcherProps = {
  workspaces: Workspace[];
};

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const router = useRouter();
  const params = useParams<{ workspaceName: string }>();
  const currentName = decodeURIComponent(params.workspaceName);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  const activeWorkspace =
    workspaces.find((workspace) => workspace.name === currentName) ??
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
            <div
              className='bg-sidebar-primary text-sidebar-primary-foreground flex
                aspect-square size-8 items-center justify-center rounded-lg'
            >
              {activeWorkspace.name.charAt(0).toUpperCase()}
            </div>
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
                      router.push(`/${encodeURIComponent(workspace.name)}`);
                    }}
                    className={cn('gap-2 p-2', isActive && 'bg-secondary')}
                  >
                    <div
                      className={cn(
                        `flex size-6 items-center justify-center rounded-md
                        border`,
                        isActive &&
                          'bg-primary text-primary-foreground! border-primary'
                      )}
                    >
                      {workspace.name.charAt(0).toUpperCase()}
                    </div>
                    {workspace.name}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuGroup>

            <DropdownMenuSeparator />

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Button type='button' variant='ghost' />}
                nativeButton
                className='w-full justify-start gap-2 p-2 font-normal'
              >
                <Link
                  href={`/${encodeURIComponent(activeWorkspace.name)}/settings`}
                  className='flex w-full items-center gap-2'
                >
                  <div
                    className='flex size-6 items-center justify-center
                      rounded-md border bg-transparent'
                  >
                    <Settings className='size-3.5' />
                  </div>

                  <div className='text-muted-foreground font-medium'>
                    Workspace settings
                  </div>
                </Link>
              </DropdownMenuItem>
            </DropdownMenuGroup>

            <DropdownMenuGroup>
              <DropdownMenuItem
                render={<Button type='button' variant='ghost' />}
                nativeButton
                className='w-full justify-start gap-2 p-2 font-normal'
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

                <div className='text-muted-foreground font-medium'>
                  Add workspace
                </div>
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
