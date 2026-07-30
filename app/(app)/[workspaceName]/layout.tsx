import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { AppSidebar } from './_components/app-sidebar';
import { SiteHeader } from './_components/site-header';
import { SubHeader } from './_components/sub-header';

type WorkspaceLayoutProps = Readonly<{
  children: React.ReactNode;
  params: Promise<{ workspaceName: string }>;
}>;

export default async function WorkspaceLayout({
  children,
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
        <AppSidebar workspaceName={workspaceName} />

        <SidebarInset>
          <SiteHeader />
          <SubHeader />

          <div className='flex flex-1 flex-col gap-4 p-4'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
