type WorkspacePageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  return <div>Overview Page</div>;
}
