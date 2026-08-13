import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailEllipsis } from './trail-ellipsis';
import { TrailSegment } from './trail-segment';
import { TrailStart } from './trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { File } from '@/convex/files';

const MAX_VISIBLE_SEGMENTS = 2;

type FileTrailProps = {
  workspaceName: string;
  fileId: Id<'files'>;
};

/** Breadcrumb trail for the single-file viewer: files home → ancestor folders →
 * the file. Deep trails collapse behind an ellipsis, keeping the last two. */
export async function FileTrail({ workspaceName, fileId }: FileTrailProps) {
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const token = await convexAuthNextjsToken();

  let file: File | null = null;
  try {
    file = await fetchQuery(
      api.files.get,
      { workspaceName: decodedWorkspaceName, fileId },
      { token }
    );
  } catch {
    // A malformed id fails argument validation; the main slot shows not-found.
    return null;
  }
  if (file === null) {
    return null;
  }

  const folderPath = file.folderId
    ? await fetchQuery(
        api.folders.path,
        { workspaceName: decodedWorkspaceName, folderId: file.folderId },
        { token }
      )
    : null;

  const workspaceSlug = encodeURIComponent(decodedWorkspaceName);

  // Ancestor folders, then the file itself (always the last segment).
  const trail = [
    ...(folderPath ?? []).map((segment) => ({
      id: segment._id as string,
      name: segment.name,
      href: `/${workspaceSlug}/files/folder/${segment._id}`,
      icon: 'folder' as const,
    })),
    {
      id: file._id as string,
      name: file.name,
      href: `/${workspaceSlug}/file/${file._id}`,
      icon: 'file' as const,
    },
  ];
  const visible = trail.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = trail.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart section='files' />
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
