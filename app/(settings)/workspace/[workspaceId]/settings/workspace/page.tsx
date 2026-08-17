import { Separator } from '@/components/ui/separator';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { SettingsAdminRequired } from '../_components/settings-admin-required';
import { DangerZone } from './_components/danger-zone';
import { WorkspaceLogoForm } from './_components/workspace-logo-form';
import { WorkspaceNameForm } from './_components/workspace-name-form';

import type { Id } from '@/convex/_generated/dataModel';

type WorkspaceSettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  const [user, workspace] = await Promise.all([
    fetchQuery(api.users.currentUser, {}, { token }),
    fetchQuery(api.workspaces.get, { workspaceId }, { token }),
  ]);

  if (workspace === null) {
    redirect('/');
  }
  const isAdmin = user?._id === workspace.adminId;

  if (!isAdmin) {
    return (
      <SettingsAdminRequired
        workspaceId={workspace._id}
        workspaceName={workspace.name}
      />
    );
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-lg font-semibold tracking-tight'>General</h1>
        <p className='text-muted-foreground text-[13px]'>
          Manage your workspace name, logo, and lifecycle.
        </p>
      </div>

      <WorkspaceNameForm
        workspaceId={workspace._id}
        workspaceName={workspace.name}
        isAdmin={isAdmin}
      />

      <WorkspaceLogoForm
        workspaceId={workspace._id}
        workspaceName={workspace.name}
        imageUrl={workspace.imageUrl}
        isAdmin={isAdmin}
      />

      <Separator />

      <DangerZone
        workspaceId={workspace._id}
        workspaceName={workspace.name}
        isAdmin={isAdmin}
      />
    </div>
  );
}
