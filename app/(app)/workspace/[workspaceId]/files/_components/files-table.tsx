'use client';

import { useState } from 'react';

import { DeleteFolderDialog } from '../../_components/delete-folder-dialog';
import { FolderRow } from '../../_components/folder-row';
import { ResourceTable } from '../../_components/resource-table';
import { DeleteFileDialog } from './delete-file-dialog';
import { FileRow } from './files-table-row';

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
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null
  );

  return (
    <>
      <ResourceTable
        isFiltered={isFiltered}
        isEmpty={folders.length === 0 && files.length === 0}
        emptyMessage='No files yet. Upload your first one.'
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
