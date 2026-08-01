import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailEllipsis } from '../../_components/trail-ellipsis';
import { TrailSegment } from '../../_components/trail-segment';
import { TrailStart } from '../../_components/trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

const MAX_VISIBLE_SEGMENTS = 2;

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

  // Deep trails collapse like Chrome's: keep the last two segments and tuck
  // the rest behind an ellipsis menu. The workflow is always the last
  // segment, so only folders can end up hidden.
  const trail = [
    ...(folderPath ?? []).map((segment) => ({
      id: segment._id as string,
      name: segment.name,
      href: `/${workspaceSlug}/workflows/folder/${segment._id}`,
      icon: 'folder' as const,
    })),
    {
      id: workflow._id as string,
      name: workflow.name,
      href: `/${workspaceSlug}/workflows/${workflow._id}`,
      icon: 'workflow' as const,
    },
  ];
  const visible = trail.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = trail.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart workspaceName={decodedWorkspaceName} />
      {hidden.length > 0 && <TrailEllipsis segments={hidden} />}
      {visible.map((segment, index) => (
        <TrailSegment
          key={segment.id}
          name={segment.name}
          href={segment.href}
          icon={segment.icon}
          isCurrent={index === visible.length - 1}
        />
      ))}
    </>
  );
}
