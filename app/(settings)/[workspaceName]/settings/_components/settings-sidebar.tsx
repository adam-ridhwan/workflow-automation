'use client';

import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { ArrowLeftIcon, Building2Icon, KeyRoundIcon, User } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SettingsSidebarProps = {
  workspaceName: string;
};

export function SettingsSidebar({ workspaceName }: SettingsSidebarProps) {
  const pathname = usePathname();
  const workspaceSlug = encodeURIComponent(workspaceName);

  const PERSONAL_SETTINGS = [
    {
      title: 'Profile',
      url: `/${workspaceSlug}/settings/account`,
      icon: <User />,
    },
  ];

  const WORKSPACE_SETTINGS = [
    {
      title: 'General',
      url: `/${workspaceSlug}/settings/workspace`,
      icon: <Building2Icon />,
    },
    {
      title: 'Secrets',
      url: `/${workspaceSlug}/settings/secrets`,
      icon: <KeyRoundIcon />,
    },
  ];

  return (
    <Sidebar collapsible='none' className='h-auto'>
      <SidebarHeader className='h-14 justify-center border-r border-b'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/${workspaceSlug}`} />}>
              <ArrowLeftIcon />
              <span className='text-lg font-semibold'>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarContent className='border-r'>
        <SidebarGroup>
          <SidebarGroupLabel>Personal</SidebarGroupLabel>
          <SidebarMenu>
            {PERSONAL_SETTINGS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Workspace</SidebarGroupLabel>
          <SidebarMenu>
            {WORKSPACE_SETTINGS.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton
                  tooltip={item.title}
                  isActive={pathname === item.url}
                  render={<Link href={item.url} />}
                >
                  {item.icon}
                  <span>{item.title}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
