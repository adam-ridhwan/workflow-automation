'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { ResourceListToolbar } from '../../_components/resource-list-toolbar';
import { UploadButton } from './upload-button';

import type { Folder } from '@/convex/folders';

const FILTERS = [
  { value: 'all', label: 'All files' },
  { value: 'indexed', label: 'Indexed' },
  { value: 'processing', label: 'Processing' },
  { value: 'failed', label: 'Failed' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'name', label: 'Name', short: 'Name' },
  { value: 'status', label: 'Status', short: 'Status' },
];

export function FilesHeader() {
  const params = useParams<{ folderId?: Folder['_id'] }>();
  // Present on /files/folder/[folderId] routes; uploads and new folders are
  // scoped to the folder being viewed.
  const folderId = params.folderId;
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  return (
    <ResourceListToolbar
      searchPlaceholder='Search files'
      filterGroupLabel='Status'
      filters={FILTERS}
      sorts={SORTS}
      trailing={
        <>
          <Button
            variant='outline'
            size='sm'
            className='h-8'
            onClick={() => {
              setShowNewFolderDialog(true);
            }}
          >
            <FolderPlusIcon />
            New folder
          </Button>
          <UploadButton folderId={folderId} />

          <NewFolderDialog
            kind='file'
            parentId={folderId}
            open={showNewFolderDialog}
            onOpenChange={setShowNewFolderDialog}
          />
        </>
      }
    />
  );
}
