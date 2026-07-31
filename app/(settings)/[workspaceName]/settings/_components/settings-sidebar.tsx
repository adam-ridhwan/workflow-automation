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
  SidebarRail,
  SidebarSeparator,
} from '@/components/ui/sidebar';
import { ArrowLeftIcon, Building2Icon } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type SettingsSidebarProps = {
  workspaceName: string;
};

export function SettingsSidebar({ workspaceName }: SettingsSidebarProps) {
  const pathname = usePathname();
  const workspaceSlug = encodeURIComponent(workspaceName);

  const items = [
    {
      title: 'General',
      url: `/${workspaceSlug}/settings/workspace`,
      icon: <Building2Icon />,
    },
  ];

  return (
    <Sidebar>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton render={<Link href={`/${workspaceSlug}`} />}>
              <ArrowLeftIcon />
              <span className='text-lg font-semibold'>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      <SidebarSeparator />

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Settings</SidebarGroupLabel>
          <SidebarMenu>
            {items.map((item) => (
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

      <SidebarRail />
    </Sidebar>
  );
}
