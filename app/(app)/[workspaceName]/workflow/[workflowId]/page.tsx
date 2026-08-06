import { redirect } from 'next/navigation';

type WorkflowPageProps = {
  params: Promise<{ workspaceName: string; workflowId: string }>;
};

/** The bare workflow route defaults to the canvas. */
export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workspaceName, workflowId } = await params;
  redirect(`/${workspaceName}/workflow/${workflowId}/canvas`);
}
