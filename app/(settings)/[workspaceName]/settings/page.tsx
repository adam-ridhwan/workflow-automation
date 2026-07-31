import { redirect } from 'next/navigation';

type SettingsPageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { workspaceName } = await params;
  redirect(`/${workspaceName}/settings/workspace`);
}
