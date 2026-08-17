import { redirect } from 'next/navigation';

type SettingsPageProps = {
  params: Promise<{ workspaceId: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceId } = await params;
  redirect(`/workspace/${workspaceId}/settings/workspace`);
}
