'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronDownIcon, FolderPlusIcon, PlusIcon } from 'lucide-react';
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
            <DropdownMenu>
              <DropdownMenuTrigger
                render={<Button size='sm' className='h-8' />}
              >
                <PlusIcon />
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
                <DropdownMenuItem render={<Link href={createHref} />}>
                  <PlusIcon className='size-3' />
                  New workflow
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
