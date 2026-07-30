'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { FolderIcon, LayoutDashboardIcon, WorkflowIcon } from 'lucide-react';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { WorkspaceSwitcher } from './workspace-switcher';

const navMain = [
  {
    title: 'Overview',
    url: '/overview',
    icon: <LayoutDashboardIcon />,
  },
  {
    title: 'Workflows',
    url: '/workflows',
    icon: <WorkflowIcon />,
  },
  {
    title: 'Files',
    url: '/files',
    icon: <FolderIcon />,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useQuery(api.users.currentUser);
  const workspaces = useQuery(api.workspaces.list) ?? [];

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={workspaces} />
      </SidebarHeader>
      <SidebarSeparator />
      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? '',
            email: user?.email ?? '',
            avatar: user?.image ?? '',
          }}
        />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  );
}
