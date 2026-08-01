import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { AppSidebar } from './_components/app-sidebar';
import { SiteHeader } from './_components/site-header';
import { WorkspaceDndProvider } from './_components/workspace-dnd-provider';

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
  breadcrumb: React.ReactNode;
  params: Promise<{ workspaceName: string }>;
}>;

export default async function WorkspaceLayout({
  children,
  breadcrumb,
  params,
}: WorkspaceLayoutProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  const workspace = await fetchQuery(
    api.workspaces.getByName,
    { name: decodedWorkspaceName },
    { token }
  );

  if (workspace === null) {
    redirect('/');
  }

  return (
    <TooltipProvider>
      <SidebarProvider>
        <AppSidebar workspaceName={decodedWorkspaceName} />

        <SidebarInset>
          <WorkspaceDndProvider workspaceName={decodedWorkspaceName}>
            <SiteHeader
              workspaceName={decodedWorkspaceName}
              breadcrumb={breadcrumb}
            />
            {children}
          </WorkspaceDndProvider>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
