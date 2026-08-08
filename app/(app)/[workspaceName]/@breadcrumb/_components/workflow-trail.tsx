import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailEllipsis } from './trail-ellipsis';
import { TrailSegment } from './trail-segment';
import { TrailStart } from './trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

const MAX_VISIBLE_SEGMENTS = 2;

type WorkflowTrailProps = {
  workspaceName: string;
  workflowId: Id<'workflows'>;
};

/** The breadcrumb trail for a workflow — ancestor folders followed by the
 * workflow itself. Shared by the workflow route's index page and its sub-route
 * pages (canvas, run-history) so the trail shows on all of them. */
export async function WorkflowTrail({
  workspaceName,
  workflowId,
}: WorkflowTrailProps) {
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
      href: `/${workspaceSlug}/workflow/${workflow._id}`,
      icon: 'workflow' as const,
    },
  ];
  const visible = trail.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = trail.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart />
      {hidden.length > 0 && <TrailEllipsis segments={hidden} />}
      {visible.map((segment, index) => (
        <TrailSegment
          key={segment.id}
          name={segment.name}
          href={segment.href}
          icon={segment.icon}
          isCurrent={index === visible.length - 1}
          folderId={
            segment.icon === 'folder'
              ? (segment.id as Id<'folders'>)
              : undefined
          }
        />
      ))}
    </>
  );
}
