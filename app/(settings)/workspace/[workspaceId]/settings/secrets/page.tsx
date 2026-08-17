import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { redirect } from 'next/navigation';

import { SettingsAdminRequired } from '../_components/settings-admin-required';
import { SecretsManager } from './_components/secrets-manager';

import type { Id } from '@/convex/_generated/dataModel';

type SecretsSettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function SecretsSettingsPage({
  params,
}: SecretsSettingsPageProps) {
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
        <h1 className='text-lg font-semibold tracking-tight'>Secrets</h1>
        <p className='text-muted-foreground text-[13px]'>
          Store API keys and tokens for this workspace. Values are encrypted and
          never shown again — workflow nodes read them by name (e.g. an LLM node
          uses <code className='font-mono'>OPENAI_API_KEY</code>).
        </p>
      </div>

      <SecretsManager workspaceId={workspace._id} />
    </div>
  );
}
