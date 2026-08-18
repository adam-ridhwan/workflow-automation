import { ReactNode } from 'react';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { SettingsHeader } from './_components/settings-header';
import { SettingsSidebar } from './_components/settings-sidebar';

import type { Id } from '@/convex/_generated/dataModel';

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceId: string }>;
};

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
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

  // Access is gated per page: personal (account) settings are open to every
  // member, workspace settings require the owner.
  return (
    <TooltipProvider>
      <SidebarProvider>
        <SettingsSidebar workspaceId={workspace._id} />

        <SidebarInset>
          <SettingsHeader workspaceName={workspace.name} />

          <div className='mx-auto w-full max-w-3xl px-6 py-8'>{children}</div>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
