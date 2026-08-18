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
  params: Promise<{ workspaceId: string; folderId: Id<'folders'> }>;
};

export default async function PagesFolderBreadcrumbPage({
  params,
}: FolderBreadcrumbPageProps) {
  const { workspaceId: workspaceIdParam, folderId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  let folderPath: FolderPathSegment[] | null = null;
  try {
    folderPath = await fetchQuery(
      api.folders.path,
      { workspaceId: workspaceId, folderId },
      { token }
    );
  } catch {
    return null;
  }

  const folderHref = (id: string) =>
    `/workspace/${workspaceId}/pages/folder/${id}`;

  const path = folderPath ?? [];
  const visible = path.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = path.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart section='pages' />
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
