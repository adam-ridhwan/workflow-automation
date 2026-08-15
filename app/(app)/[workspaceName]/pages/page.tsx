import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { sieveFolders } from '../_lib/sieve-resources';
import { PagesEmpty } from './_components/pages-empty';
import { PagesTable } from './_components/pages-table';
import { sievePages } from './_lib/sieve-pages';

import type { PagesSearchParams } from './_lib/sieve-pages';

type PagesPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<PagesSearchParams>;
};

export default async function PagesPage({
  params,
  searchParams,
}: PagesPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const [pages, folders] = await Promise.all([
    fetchQuery(api.pages.list, { workspaceName: decodedWorkspaceName }, { token }),
    fetchQuery(
      api.folders.list,
      { workspaceName: decodedWorkspaceName, kind: 'page' },
      { token }
    ),
  ]);

  if (pages.length === 0 && folders.length === 0) {
    return <PagesEmpty />;
  }

  const sievedPages = sievePages(pages, { state, sort, order, q });
  const sievedFolders = sieveFolders(folders, { state, q });

  return (
    <PagesTable
      pages={sievedPages}
      folders={sievedFolders}
      isFiltered={Boolean(state || q)}
    />
  );
}
