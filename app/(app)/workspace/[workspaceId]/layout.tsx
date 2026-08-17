import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { AppSidebar } from './_components/app-sidebar';
import { SiteHeader } from './_components/site-header';
import { WorkspaceDndProvider } from './_components/workspace-dnd-provider';

import type { Id } from '@/convex/_generated/dataModel';
type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
  headerActions: React.ReactNode;
  params: Promise<{ workspaceId: string }>;
}>;

export default async function WorkspaceLayout({
  children,
  breadcrumb,
  headerActions,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  const workspace = await fetchQuery(
    api.workspaces.get,
    { workspaceId },
    { token }
  );

  if (workspace === null) {
    redirect('/');
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar workspaceId={workspaceId} />

        <SidebarInset>
          <WorkspaceDndProvider>
            <SiteHeader
              workspaceId={workspaceId}
              breadcrumb={breadcrumb}
              headerActions={headerActions}
            />
            {children}
          </WorkspaceDndProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
