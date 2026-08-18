'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, FolderPlusIcon, UploadIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { ResourceListToolbar } from '../../_components/resource-list-toolbar';
import { useCanWrite } from '../../_hooks/use-can-write';
import { useFileUpload } from './upload-button';

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
  const canWrite = useCanWrite();
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  // The hidden file input lives here (not inside the dropdown) so it survives
  // the menu closing on click and still receives the picked files.
  const { open: openUpload, input: uploadInput } = useFileUpload(folderId);

  return (
    <ResourceListToolbar
      searchPlaceholder='Search files'
      filterGroupLabel='Status'
      filters={FILTERS}
      sorts={SORTS}
      trailing={
        canWrite && (
          <>
            {uploadInput}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size='sm' className='h-8' />}
              >
                <UploadIcon />
                New
                <ChevronDownIcon className='size-3.5' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-40'>
                <DropdownMenuItem
                  onClick={() => {
                    setShowNewFolderDialog(true);
                  }}
                >
                  <FolderPlusIcon className='size-3' />
                  New folder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={openUpload}>
                  <UploadIcon className='size-3' />
                  Upload files
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <NewFolderDialog
              kind='file'
              parentId={folderId}
              open={showNewFolderDialog}
              onOpenChange={setShowNewFolderDialog}
            />
          </>
        )
      }
    />
  );
}
