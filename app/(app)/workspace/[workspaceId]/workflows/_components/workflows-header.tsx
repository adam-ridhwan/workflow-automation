'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { FolderPlusIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { ResourceListToolbar } from '../../_components/resource-list-toolbar';
import { useCanWrite } from '../../_hooks/use-can-write';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

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
  const { workspaceId } = useWorkspaceParams();
  const canWrite = useCanWrite();
  const params = useParams<{ folderId?: Folder['_id'] }>();
  // Present on /workflows/folder/[folderId] routes; creation is scoped to
  // the folder being viewed.
  const folderId = params.folderId;
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);

  // Carry the folder scope into the create route so a blank/templated workflow
  // lands in the folder the user is viewing.
  const createHref = `/workspace/${workspaceId}/workflow/create${
    folderId ? `?folderId=${folderId}` : ''
  }`;

  return (
    <ResourceListToolbar
      searchPlaceholder='Search workflows'
      filterGroupLabel='State'
      filters={FILTERS}
      sorts={SORTS}
      trailing={
        canWrite && (
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
              nativeButton={false}
              render={<Link href={createHref} />}
            >
              <PlusIcon />
              New workflow
            </Button>

            <NewFolderDialog
              kind='workflow'
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
