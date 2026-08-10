'use client';

import { useState } from 'react';

import { ResourceTable } from '../../_components/resource-table';
import { DeleteFileDialog } from './delete-file-dialog';
import { FileRow } from './file-row';

import type { File } from '@/convex/files';
import type { Folder } from '@/convex/folders';

type FilesTableProps = {
  files: File[];
  folders?: Folder[];
  isFiltered: boolean;
};

export function FilesTable({
  files,
  folders = [],
  isFiltered,
}: FilesTableProps) {
  const [deleteTarget, setDeleteTarget] = useState<File | null>(null);

  return (
    <>
      <ResourceTable
        folders={folders}
        itemCount={files.length}
        itemNoun='file'
        itemNounPlural='files'
        isFiltered={isFiltered}
        emptyMessage='No files yet. Upload your first one.'
      >
        {files.map((file) => (
          <FileRow
            key={file._id}
            file={file}
            onDelete={() => {
              setDeleteTarget(file);
            }}
          />
        ))}
      </ResourceTable>

      <DeleteFileDialog
        file={deleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
          }
        }}
      />
    </>
  );
}
