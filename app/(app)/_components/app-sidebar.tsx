'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import {
  AudioLinesIcon,
  FolderIcon,
  GalleryVerticalEndIcon,
  LayoutDashboardIcon,
  TerminalIcon,
  WorkflowIcon,
} from 'lucide-react';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { WorkspaceSwitcher } from './workspace-switcher';

// This is sample data.
const data = {
  workspaces: [
    {
      name: 'Acme Inc',
      logo: <GalleryVerticalEndIcon />,
      plan: 'Enterprise',
    },
    {
      name: 'Acme Corp.',
      logo: <AudioLinesIcon />,
      plan: 'Startup',
    },
    {
      name: 'Evil Corp.',
      logo: <TerminalIcon />,
      plan: 'Free',
    },
  ],
  navMain: [
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
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const user = useQuery(api.users.currentUser);

  return (
    <Sidebar collapsible='icon' {...props}>
      <SidebarHeader>
        <WorkspaceSwitcher workspaces={data.workspaces} />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={data.navMain} />
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
