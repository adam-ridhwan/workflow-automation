import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import { sieveFolders } from '../../../_lib/sieve-resources';
import { PagesTable } from '../../_components/pages-table';
import { sievePages } from '../../_lib/sieve-pages';

import type { PagesSearchParams } from '../../_lib/sieve-pages';
import type { Id } from '@/convex/_generated/dataModel';
import type { Folder } from '@/convex/folders';

type FolderPageProps = {
  params: Promise<{ workspaceId: string; folderId: Id<'folders'> }>;
  searchParams: Promise<PagesSearchParams>;
};

export default async function PagesFolderPage({
  params,
  searchParams,
}: FolderPageProps) {
  const { workspaceId: workspaceIdParam, folderId } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  let folder: Folder | null = null;
  try {
    folder = await fetchQuery(
      api.folders.get,
      { workspaceId: workspaceId, folderId },
      { token }
    );
  } catch {
    notFound();
  }
  if (folder === null) {
    notFound();
  }

  const [pages, subfolders] = await Promise.all([
    fetchQuery(
      api.pages.list,
      { workspaceId: workspaceId, folderId: folder._id },
      { token }
    ),
    fetchQuery(
      api.folders.list,
      {
        workspaceId: workspaceId,
        kind: 'page',
        parentId: folder._id,
      },
      { token }
    ),
  ]);
  const sievedPages = sievePages(pages, { state, sort, order, q });
  const sievedFolders = sieveFolders(subfolders, { state, q });

  return (
    <PagesTable
      pages={sievedPages}
      folders={sievedFolders}
      isFiltered={Boolean(state || q)}
    />
  );
}
