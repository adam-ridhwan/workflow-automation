'use client';

import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type NavMainProps = {
  items: {
    title: string;
    url: string;
    icon?: React.ReactNode;
    /** Section path segments (right after the workspace) that mark this item
     * active — e.g. ['workflows', 'workflow'] so both the list and a workflow's
     * detail route highlight it. When omitted, only an exact url match wins. */
    match?: string[];
  }[];
};

export function NavMain({ items }: NavMainProps) {
  const pathname = usePathname();
  // Routes are /workspace/<id>/<section>/…, so the third segment identifies the
  // section, e.g. /workspace/<id>/workflow/<id>/canvas -> 'workflow'.
  const section = pathname.split('/').filter(Boolean)[2] ?? '';

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Platform</SidebarGroupLabel>
      <SidebarMenu>
        {items.map((item) => (
          <SidebarMenuItem key={item.title}>
            <SidebarMenuButton
              tooltip={item.title}
              isActive={
                item.match ? item.match.includes(section) : pathname === item.url
              }
              render={<Link href={item.url} />}
            >
              {item.icon}
              <span>{item.title}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
