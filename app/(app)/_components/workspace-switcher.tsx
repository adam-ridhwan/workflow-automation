'use client';

import { useState } from 'react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuShortcut,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from '@/components/ui/sidebar';
import { ChevronsUpDownIcon, PlusIcon } from 'lucide-react';

import type { Id } from '@/convex/_generated/dataModel';

type WorkspaceSwitcherProps = {
  workspaces: {
    _id: Id<'workspaces'>;
    name: string;
  }[];
};

export function WorkspaceSwitcher({ workspaces }: WorkspaceSwitcherProps) {
  const { isMobile } = useSidebar();
  const [selectedId, setSelectedId] = useState<Id<'workspaces'> | null>(null);

  const activeWorkspace =
    workspaces.find((workspace) => workspace._id === selectedId) ??
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
          <DropdownMenuContent
            className='w-fit'
            align='start'
            side={isMobile ? 'bottom' : 'right'}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className='text-muted-foreground text-xs'>
                Workspaces
              </DropdownMenuLabel>
              {workspaces.map((workspace, index) => (
                <DropdownMenuItem
                  key={workspace._id}
                  onClick={() => setSelectedId(workspace._id)}
                  className='gap-2 p-2'
                >
                  <div
                    className='flex size-6 items-center justify-center
                      rounded-md border'
                  >
                    {workspace.name.charAt(0).toUpperCase()}
                  </div>
                  {workspace.name}
                  <DropdownMenuShortcut>⌘{index + 1}</DropdownMenuShortcut>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem className='gap-2 p-2'>
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
      </SidebarMenuItem>
    </SidebarMenu>
  );
}
