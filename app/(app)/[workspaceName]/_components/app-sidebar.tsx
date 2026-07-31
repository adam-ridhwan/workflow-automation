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
import { FolderIcon, LayoutDashboardIcon, WorkflowIcon } from 'lucide-react';

import { NavMain } from './nav-main';
import { NavUser } from './nav-user';
import { WorkspaceSwitcher } from './workspace-switcher';

type AppSidebarProps = {
  workspaceName: string;
};

export async function AppSidebar({ workspaceName }: AppSidebarProps) {
  const token = await convexAuthNextjsToken();
  const [user, workspaces] = await Promise.all([
    fetchQuery(api.users.currentUser, {}, { token }),
    fetchQuery(api.workspaces.list, {}, { token }),
  ]);

  const workspaceSlug = encodeURIComponent(workspaceName);
  const navMain = [
    {
      title: 'Overview',
      url: `/${workspaceSlug}`,
      icon: <LayoutDashboardIcon />,
    },
    {
      title: 'Workflows',
      url: `/${workspaceSlug}/workflows`,
      icon: <WorkflowIcon />,
    },
    {
      title: 'Files',
      url: `/${workspaceSlug}/files`,
      icon: <FolderIcon />,
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
            avatar: user?.image ?? '',
          }}
        />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
