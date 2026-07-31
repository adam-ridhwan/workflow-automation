import { ReactNode } from 'react';
import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';
import { TooltipProvider } from '@/components/ui/tooltip';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { LockIcon } from 'lucide-react';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { SettingsHeader } from './_components/settings-header';
import { SettingsSidebar } from './_components/settings-sidebar';

type SettingsLayoutProps = {
  children: ReactNode;
  params: Promise<{ workspaceName: string }>;
};

export default async function SettingsLayout({
  children,
  params,
}: SettingsLayoutProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  const [user, workspace] = await Promise.all([
    fetchQuery(api.queries.users.currentUser, {}, { token }),
    fetchQuery(
      api.queries.workspaces.getByName,
      { name: decodedWorkspaceName },
      { token }
    ),
  ]);

  if (workspace === null) {
    redirect('/');
  }

  const isAdmin = user?._id === workspace.adminId;

  return (
    <TooltipProvider>
      <SidebarProvider>
        <SettingsSidebar workspaceName={decodedWorkspaceName} />

        <SidebarInset>
          <SettingsHeader workspaceName={decodedWorkspaceName} />

          {isAdmin ? (
            <div className='mx-auto w-full max-w-3xl px-6 py-8'>{children}</div>
          ) : (
            <Empty>
              <EmptyHeader>
                <EmptyMedia variant='icon'>
                  <LockIcon />
                </EmptyMedia>
                <EmptyTitle>Admin access required</EmptyTitle>
                <EmptyDescription>
                  Only the workspace admin can manage settings for{' '}
                  {decodedWorkspaceName}.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button
                  variant='outline'
                  size='sm'
                  nativeButton={false}
                  render={
                    <Link
                      href={`/${encodeURIComponent(decodedWorkspaceName)}`}
                    />
                  }
                >
                  Back to workspace
                </Button>
              </EmptyContent>
            </Empty>
          )}
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  );
}
