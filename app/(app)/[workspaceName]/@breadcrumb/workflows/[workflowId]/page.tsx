import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailSegment } from '../../_components/trail-segment';
import { TrailStart } from '../../_components/trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

type WorkflowBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string; workflowId: Id<'workflows'> }>;
};

export default async function WorkflowBreadcrumbPage({
  params,
}: WorkflowBreadcrumbPageProps) {
  const { workspaceName, workflowId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  let workflow: Workflow | null = null;
  try {
    workflow = await fetchQuery(
      api.workflows.get,
      { workspaceName: decodedWorkspaceName, workflowId },
      { token }
    );
  } catch {
    // A malformed id fails argument validation; the main slot renders the
    // not-found page, so show no trail here.
    return null;
  }
  if (workflow === null) {
    return null;
  }

  const folderPath = workflow.folderId
    ? await fetchQuery(
        api.folders.path,
        { workspaceName: decodedWorkspaceName, folderId: workflow.folderId },
        { token }
      )
    : null;

  const workspaceSlug = encodeURIComponent(decodedWorkspaceName);

  return (
    <>
      <TrailStart workspaceName={decodedWorkspaceName} />
      {(folderPath ?? []).map((segment) => (
        <TrailSegment
          key={segment._id}
          name={segment.name}
          href={`/${workspaceSlug}/workflows/folder/${segment._id}`}
          icon='folder'
          isCurrent={false}
        />
      ))}
      <TrailSegment
        name={workflow.name}
        href={`/${workspaceSlug}/workflows/${workflow._id}`}
        icon='workflow'
        isCurrent
      />
    </>
  );
}
