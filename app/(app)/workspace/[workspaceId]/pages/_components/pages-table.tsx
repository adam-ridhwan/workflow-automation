'use client';

import { useState } from 'react';

import { DeleteFolderDialog } from '../../_components/delete-folder-dialog';
import { FolderRow } from '../../_components/folder-row';
import { ResourceTable } from '../../_components/resource-table';
import { DeletePageDialog } from './delete-page-dialog';
import { PagesTableRow } from './pages-table-row';

import type { Folder } from '@/convex/folders';
import type { Page } from '@/convex/pages';

type PagesTableProps = {
  pages: Page[];
  folders?: Folder[];
  isFiltered: boolean;
};

export function PagesTable({
  pages,
  folders = [],
  isFiltered,
}: PagesTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<Page | null>(null);
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null
  );

  return (
    <>
      <ResourceTable
        isFiltered={isFiltered}
        isEmpty={folders.length === 0 && pages.length === 0}
        emptyMessage='No pages yet. Create your first one.'
      >
        {folders.map((folder) => (
          <FolderRow
            key={folder._id}
            folder={folder}
            onDelete={() => {
              setFolderDeleteTarget(folder);
            }}
          />
        ))}
        {pages.map((page) => (
          <PagesTableRow
            key={page._id}
            page={page}
            onDelete={() => {
              setDeleteTarget(page);
            }}
          />
        ))}
      </ResourceTable>

      <DeletePageDialog
        page={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />

      <DeleteFolderDialog
        folder={folderDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
