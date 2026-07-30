'use client';

import { useState } from 'react';
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
import { ChevronsUpDownIcon, PlusIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

import { CreateWorkspaceDialog } from './create-workspace-dialog';

import type { Workspace } from '@/convex/workspaces';

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
              {workspaces.map((workspace) => (
                <DropdownMenuItem
                  key={workspace._id}
                  onClick={() => {
                    router.push(`/${encodeURIComponent(workspace.name)}`);
                  }}
                  className='gap-2 p-2'
                >
                  <div
                    className='flex size-6 items-center justify-center
                      rounded-md border'
                  >
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  {workspace.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
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
