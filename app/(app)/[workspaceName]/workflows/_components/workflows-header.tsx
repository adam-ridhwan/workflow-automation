'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlusIcon, PlusIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { ResourceListToolbar } from '../../_components/resource-list-toolbar';
import { NewWorkflowDialog } from './new-workflow-dialog';

import type { Folder } from '@/convex/folders';

const FILTERS = [
  { value: 'all', label: 'All workflows' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'name', label: 'Name', short: 'Name' },
  { value: 'status', label: 'Status', short: 'Status' },
];

export function WorkflowsHeader() {
  const params = useParams<{ folderId?: Folder['_id'] }>();
  // Present on /workflows/folder/[folderId] routes; creation is scoped to
  // the folder being viewed.
  const folderId = params.folderId;
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  return (
    <ResourceListToolbar
      searchPlaceholder='Search workflows'
      filterGroupLabel='State'
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
          <Button
            size='sm'
            className='h-8'
            onClick={() => {
              setShowNewDialog(true);
            }}
          >
            <PlusIcon />
            New workflow
          </Button>

          <NewWorkflowDialog
            folderId={folderId}
            open={showNewDialog}
            onOpenChange={setShowNewDialog}
          />
          <NewFolderDialog
            kind='workflow'
            parentId={folderId}
            open={showNewFolderDialog}
            onOpenChange={setShowNewFolderDialog}
          />
        </>
      }
    />
  );
}
