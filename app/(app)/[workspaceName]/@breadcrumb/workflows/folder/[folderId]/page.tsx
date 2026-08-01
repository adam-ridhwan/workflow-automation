import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailEllipsis } from '../../../_components/trail-ellipsis';
import { TrailSegment } from '../../../_components/trail-segment';
import { TrailStart } from '../../../_components/trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { FolderPathSegment } from '@/convex/folders';

const MAX_VISIBLE_SEGMENTS = 2;

type FolderBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string; folderId: Id<'folders'> }>;
};

export default async function FolderBreadcrumbPage({
  params,
}: FolderBreadcrumbPageProps) {
  const { workspaceName, folderId } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);

  const token = await convexAuthNextjsToken();
  let folderPath: FolderPathSegment[] | null = null;
  try {
    folderPath = await fetchQuery(
      api.folders.path,
      { workspaceName: decodedWorkspaceName, folderId },
      { token }
    );
  } catch {
    // A malformed id fails argument validation; the main slot renders the
    // not-found page, so show no trail here.
    return null;
  }

  const workspaceSlug = encodeURIComponent(decodedWorkspaceName);
  const folderHref = (id: string) => `/${workspaceSlug}/workflows/folder/${id}`;

  // Deep trails collapse like Chrome's: keep the last two segments and tuck
  // the rest behind an ellipsis menu.
  const path = folderPath ?? [];
  const visible = path.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = path.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart />
      {hidden.length > 0 && (
        <TrailEllipsis
          segments={hidden.map((segment) => ({
            id: segment._id,
            name: segment.name,
            href: folderHref(segment._id),
          }))}
        />
      )}
      {visible.map((segment, index) => (
        <TrailSegment
          key={segment._id}
          name={segment.name}
          href={folderHref(segment._id)}
          icon='folder'
          isCurrent={index === visible.length - 1}
          folderId={segment._id}
        />
      ))}
    </>
  );
}
