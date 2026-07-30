import { Separator } from '@/components/ui/separator';
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { AppSidebar } from './_components/app-sidebar';

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
          <header
            className='flex h-16 shrink-0 items-center gap-2
              transition-[width,height] ease-linear
              group-has-data-[collapsible=icon]/sidebar-wrapper:h-12'
          >
            <div className='flex items-center gap-2 px-4'>
              <SidebarTrigger className='-ml-1' />

              <Separator
                orientation='vertical'
                className='mr-2 data-vertical:h-4 data-vertical:self-auto'
              />
            </div>
          </header>

          <div className='flex flex-1 flex-col gap-4 p-4 pt-0'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
