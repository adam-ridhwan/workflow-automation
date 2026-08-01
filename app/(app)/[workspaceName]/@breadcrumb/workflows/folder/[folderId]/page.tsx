import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailSegment } from '../../../_components/trail-segment';
import { TrailStart } from '../../../_components/trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { FolderPathSegment } from '@/convex/folders';

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

  return (
    <>
      <TrailStart workspaceName={decodedWorkspaceName} />
      {(folderPath ?? []).map((segment, index, segments) => (
        <TrailSegment
          key={segment._id}
          name={segment.name}
          href={`/${workspaceSlug}/workflows/folder/${segment._id}`}
          icon='folder'
          isCurrent={index === segments.length - 1}
        />
      ))}
    </>
  );
}
