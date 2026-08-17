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

import type { Id } from '@/convex/_generated/dataModel';

type SettingsSidebarProps = {
  workspaceId: Id<'workspaces'>;
};

export function SettingsSidebar({ workspaceId }: SettingsSidebarProps) {
  const pathname = usePathname();
  const workspaceBase = `/workspace/${workspaceId}`;

  const PERSONAL_SETTINGS = [
    {
      title: 'Profile',
      url: `${workspaceBase}/settings/account`,
      icon: <User />,
    },
  ];

  const WORKSPACE_SETTINGS = [
    {
      title: 'General',
      url: `${workspaceBase}/settings/workspace`,
      icon: <Building2Icon />,
    },
    {
      title: 'Secrets',
      url: `${workspaceBase}/settings/secrets`,
      icon: <KeyRoundIcon />,
    },
  ];

  return (
    <Sidebar collapsible='none' className='h-auto'>
      <SidebarHeader className='h-14 justify-center border-r border-b'>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={workspaceBase} />}>
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
