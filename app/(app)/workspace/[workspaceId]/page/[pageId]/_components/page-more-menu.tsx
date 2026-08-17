'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { useMutation, useQuery } from 'convex/react';
import {
  CopyIcon,
  EllipsisVerticalIcon,
  ExternalLinkIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useCanWrite } from '../../../_hooks/use-can-write';
import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';
import { PageDeleteDialog } from './page-delete-dialog';
import { PageRenameDialog } from './page-rename-dialog';

/** The "more actions" (⋯) header menu: rename, duplicate, or delete the current
 * page. Mirrors the workflow header more-menu. */
export function PageMoreMenu() {
  const { workspaceId, pageId } = useWorkspaceParams();
  const page = useQuery(api.pages.get, { workspaceId, pageId });
  const duplicatePage = useMutation(api.pages.duplicate);
  const canWrite = useCanWrite();
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!page || !canWrite) {
    return null;
  }

  async function handleDuplicate() {
    try {
      const newPageId = await duplicatePage({ workspaceId, pageId });
      toast.add({ type: 'success', title: 'Page duplicated.' });
      router.push(`/workspace/${workspaceId}/page/${newPageId}`);
    } catch (error) {
      toast.add({
        type: 'error',
        title: errorMessage(
          error,
          'Could not duplicate the page. Please try again.'
        ),
      });
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button variant='ghost' size='icon' aria-label='More actions' />
          }
        >
          <EllipsisVerticalIcon className='size-4' />
        </DropdownMenuTrigger>

        <DropdownMenuContent align='end' className='w-44'>
          {page.isPublished && (
            <>
              <DropdownMenuItem
                onClick={() => {
                  window.open(`/${pageId}`, '_blank', 'noopener,noreferrer');
                }}
              >
                <ExternalLinkIcon className='size-3' />
                Open published
              </DropdownMenuItem>
              <DropdownMenuSeparator />
            </>
          )}

          <DropdownMenuItem
            onClick={() => {
              setRenameOpen(true);
            }}
          >
            <PencilIcon className='size-3' />
            Rename
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleDuplicate}>
            <CopyIcon className='size-3' />
            Duplicate
          </DropdownMenuItem>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={() => {
              setDeleteOpen(true);
            }}
          >
            <Trash2Icon className='size-3' />
            Delete
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <PageRenameDialog
        currentName={page.name}
        open={renameOpen}
        onOpenChange={setRenameOpen}
      />
      <PageDeleteDialog
        name={page.name}
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
      />
    </>
  );
}
