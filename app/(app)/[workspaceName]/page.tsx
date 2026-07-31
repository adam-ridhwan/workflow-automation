import { redirect } from 'next/navigation';

type WorkspacePageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceName } = await params;
  redirect(`/${workspaceName}/workflows`);
}
