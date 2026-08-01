'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FolderPlusIcon, PlusIcon, WorkflowIcon } from 'lucide-react';
import { useParams } from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { SectionLabel } from '../../_components/section-label';
import { NewWorkflowDialog } from './new-workflow-dialog';

import type { Folder } from '@/convex/folders';

/** Plus button next to the page title: creates a workflow or folder, scoped
 * to the folder being viewed. */
export function NewItemMenu() {
  const params = useParams<{ folderId?: Folder['_id'] }>();
  const folderId = params.folderId;
  const [showNewWorkflow, setShowNewWorkflow] = useState(false);
  const [showNewFolder, setShowNewFolder] = useState(false);

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              className='h-8 gap-1.5 px-2'
              aria-label='New workflow or folder'
            />
          }
        >
          <SectionLabel />
          <PlusIcon className='text-muted-foreground size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-46'>
          <DropdownMenuItem
            onClick={() => {
              setShowNewWorkflow(true);
            }}
          >
            <WorkflowIcon />
            New workflow
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => {
              setShowNewFolder(true);
            }}
          >
            <FolderPlusIcon />
            New folder
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <NewWorkflowDialog
        folderId={folderId}
        open={showNewWorkflow}
        onOpenChange={setShowNewWorkflow}
      />
      <NewFolderDialog
        parentId={folderId}
        open={showNewFolder}
        onOpenChange={setShowNewFolder}
      />
    </>
  );
}
