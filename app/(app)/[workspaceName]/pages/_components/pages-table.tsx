'use client';

import { useState } from 'react';

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

  return (
    <>
      <ResourceTable
        folders={folders}
        itemCount={pages.length}
        itemNoun='page'
        itemNounPlural='pages'
        isFiltered={isFiltered}
        emptyMessage='No pages yet. Create your first one.'
      >
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
    </>
  );
}
