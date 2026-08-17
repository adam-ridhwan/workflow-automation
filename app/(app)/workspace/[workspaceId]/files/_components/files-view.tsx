'use client';

import { api } from '@/convex/_generated/api';
import { usePreloadedQuery } from 'convex/react';
import { useSearchParams } from 'next/navigation';

import { sieveFiles } from '../_lib/sieve-files';
import { sieveFolders } from '../../_lib/sieve-resources';
import { FilesEmpty } from './files-empty';
import { FilesTable } from './files-table';

import type { FileStatus } from '@/convex/files';
import type { Preloaded } from 'convex/react';

type FilesViewProps = {
  preloadedFiles: Preloaded<typeof api.files.list>;
  preloadedFolders: Preloaded<typeof api.folders.list>;
  /** The root list shows the full empty state; folder views show the inline
   * empty row from the table instead. */
  isRoot: boolean;
};

/** Client view over the reactive files + folders queries. Subscribing here
 * (rather than reading a server snapshot) is what lets upload progress and the
 * processing → indexed transition stream in live over Convex's websocket. */
export function FilesView({
  preloadedFiles,
  preloadedFolders,
  isRoot,
}: FilesViewProps) {
  const files = usePreloadedQuery(preloadedFiles);
  const folders = usePreloadedQuery(preloadedFolders);
  const searchParams = useSearchParams();

  const state = searchParams.get('state') ?? undefined;
  const sort = searchParams.get('sort') ?? undefined;
  const order = searchParams.get('order') === 'asc' ? 'asc' : undefined;
  const q = searchParams.get('q') ?? undefined;

  if (isRoot && files.length === 0 && folders.length === 0 && !state && !q) {
    return <FilesEmpty />;
  }

  const sievedFiles = sieveFiles(files, {
    state: state as FileStatus | undefined,
    sort,
    order,
    q,
  });
  const sievedFolders = sieveFolders(folders, { state, q });

  return (
    <FilesTable
      files={sievedFiles}
      folders={sievedFolders}
      isFiltered={Boolean(state || q)}
    />
  );
}
