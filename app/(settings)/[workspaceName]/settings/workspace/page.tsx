import { Separator } from '@/components/ui/separator';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { SettingsAdminRequired } from '../_components/settings-admin-required';
import { DangerZone } from './_components/danger-zone';
import { WorkspaceLogoForm } from './_components/workspace-logo-form';
import { WorkspaceNameForm } from './_components/workspace-name-form';

type WorkspaceSettingsPageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function WorkspaceSettingsPage({
  params,
}: WorkspaceSettingsPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  const [user, workspace] = await Promise.all([
    fetchQuery(api.users.currentUser, {}, { token }),
    fetchQuery(
      api.workspaces.getByName,
      { name: decodedWorkspaceName },
      { token }
    ),
  ]);

  if (workspace === null) {
    redirect('/');
  }
  const isAdmin = user?._id === workspace.adminId;

  if (!isAdmin) {
    return <SettingsAdminRequired workspaceName={workspace.name} />;
  }

  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-1'>
        <h1 className='text-lg font-semibold tracking-tight'>General</h1>
        <p className='text-muted-foreground text-[13px]'>
          Manage your workspace name, logo, and lifecycle.
        </p>
      </div>

      <WorkspaceNameForm workspaceName={workspace.name} isAdmin={isAdmin} />

      <WorkspaceLogoForm
        workspaceName={workspace.name}
        imageUrl={workspace.imageUrl}
        isAdmin={isAdmin}
      />

      <Separator />

      <DangerZone workspaceName={workspace.name} isAdmin={isAdmin} />
    </div>
  );
}
