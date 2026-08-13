import { FileViewer } from './_components/file-viewer';

type FileViewPageProps = {
  params: Promise<{ workspaceName: string; fileId: string }>;
};

export default async function FileViewPage({ params }: FileViewPageProps) {
  const { workspaceName, fileId } = await params;
  return (
    <FileViewer
      workspaceName={decodeURIComponent(workspaceName)}
      fileId={fileId}
    />
  );
}
