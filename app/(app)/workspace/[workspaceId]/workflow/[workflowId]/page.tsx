import { redirect } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

type WorkflowPageProps = {
  params: Promise<{ workspaceId: string; workflowId: string }>;
};

/** The bare workflow route defaults to the canvas. */
export default async function WorkflowPage({ params }: WorkflowPageProps) {
  const { workspaceId: workspaceIdParam, workflowId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  redirect(`/workspace/${workspaceId}/workflow/${workflowId}/canvas`);
}
