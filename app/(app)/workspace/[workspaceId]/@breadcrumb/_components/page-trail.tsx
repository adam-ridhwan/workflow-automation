import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { TrailEllipsis } from './trail-ellipsis';
import { TrailSegment } from './trail-segment';
import { TrailStart } from './trail-start';

import type { Id } from '@/convex/_generated/dataModel';
import type { Page } from '@/convex/pages';

const MAX_VISIBLE_SEGMENTS = 2;

type PageTrailProps = {
  workspaceId: Id<'workspaces'>;
  pageId: Id<'pages'>;
};

/** The breadcrumb trail for a page — ancestor folders followed by the page
 * itself. */
export async function PageTrail({ workspaceId, pageId }: PageTrailProps) {

  const token = await convexAuthNextjsToken();
  let page: Page | null = null;
  try {
    page = await fetchQuery(
      api.pages.get,
      { workspaceId: workspaceId, pageId },
      { token }
    );
  } catch {
    // A malformed id fails argument validation; the main slot renders the
    // not-found page, so show no trail here.
    return null;
  }
  if (page === null) {
    return null;
  }

  const folderPath = page.folderId
    ? await fetchQuery(
        api.folders.path,
        { workspaceId: workspaceId, folderId: page.folderId },
        { token }
      )
    : null;


  const trail = [
    ...(folderPath ?? []).map((segment) => ({
      id: segment._id as string,
      name: segment.name,
      href: `/workspace/${workspaceId}/pages/folder/${segment._id}`,
      icon: 'folder' as const,
    })),
    {
      id: page._id as string,
      name: page.name,
      href: `/workspace/${workspaceId}/page/${page._id}`,
      icon: 'page' as const,
    },
  ];
  const visible = trail.slice(-MAX_VISIBLE_SEGMENTS);
  const hidden = trail.slice(0, -MAX_VISIBLE_SEGMENTS);

  return (
    <>
      <TrailStart section='pages' />
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
