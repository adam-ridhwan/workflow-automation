import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { WorkflowCanvas } from '../_components/workflow-canvas/workflow-canvas';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

type WorkflowCanvasPageProps = {
  params: Promise<{ workspaceId: string; workflowId: string }>;
};

export default async function WorkflowCanvasPage({
  params,
}: WorkflowCanvasPageProps) {
  const { workspaceId: workspaceIdParam, workflowId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  let workflow: Workflow | null = null;
  try {
    workflow = await fetchQuery(
      api.workflows.get,
      {
        workspaceId: workspaceId,
        workflowId: workflowId as Id<'workflows'>,
      },
      { token }
    );
  } catch {
    notFound();
  }
  if (workflow === null) {
    notFound();
  }

  return <WorkflowCanvas canvas={workflow.canvas} />;
}
