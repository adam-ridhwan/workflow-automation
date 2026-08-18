import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import {
  CalendarClockIcon,
  FolderIcon,
  HouseIcon,
  LayoutTemplateIcon,
  WorkflowIcon,
} from 'lucide-react';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { WorkspaceSwitcher } from './workspace-switcher';

import type { Id } from '@/convex/_generated/dataModel';

type AppSidebarProps = {
  workspaceId: Id<'workspaces'>;
};

export async function AppSidebar({ workspaceId }: AppSidebarProps) {
  const token = await convexAuthNextjsToken();
  const [user, workspaces] = await Promise.all([
    fetchQuery(api.users.currentUser, {}, { token }),
    fetchQuery(api.workspaces.list, {}, { token }),
  ]);

  const navMain = [
    {
      title: 'Overview',
      url: `/workspace/${workspaceId}`,
      icon: <HouseIcon />,
    },
    {
      title: 'Workflows',
      url: `/workspace/${workspaceId}/workflows`,
      icon: <WorkflowIcon />,
      match: ['workflows', 'workflow'],
    },
    {
      title: 'Pages',
      url: `/workspace/${workspaceId}/pages`,
      icon: <LayoutTemplateIcon />,
      match: ['pages', 'page'],
    },
    {
      title: 'Files',
      url: `/workspace/${workspaceId}/files`,
      icon: <FolderIcon />,
      match: ['files', 'file'],
    },
    {
      title: 'Schedules',
      url: `/workspace/${workspaceId}/schedules`,
      icon: <CalendarClockIcon />,
      match: ['schedules'],
    },
  ];

  return (
    <Sidebar collapsible='icon'>
      <SidebarHeader className='h-14 justify-center border-b py-1'>
        <WorkspaceSwitcher workspaces={workspaces} />
      </SidebarHeader>

      <SidebarContent>
        <NavMain items={navMain} />
      </SidebarContent>

      <SidebarFooter>
        <NavUser
          user={{
            name: user?.name ?? '',
            email: user?.email ?? '',
            avatar: user?.imageUrl ?? '',
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
