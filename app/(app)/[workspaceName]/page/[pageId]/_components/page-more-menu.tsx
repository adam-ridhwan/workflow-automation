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
  GlobeIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';
import { PageDeleteDialog } from './page-delete-dialog';
import { PageRenameDialog } from './page-rename-dialog';

/** The "more actions" (⋯) header menu: rename, duplicate, or delete the current
 * page. Mirrors the workflow header more-menu. */
export function PageMoreMenu() {
  const { workspaceName, pageId } = useWorkspaceParams();
  const page = useQuery(api.pages.get, { workspaceName, pageId });
  const duplicatePage = useMutation(api.pages.duplicate);
  const setPublished = useMutation(api.pages.setPublished);
  const router = useRouter();
  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!page) {
    return null;
  }

  async function handleDuplicate() {
    try {
      const newPageId = await duplicatePage({ workspaceName, pageId });
      toast.add({ type: 'success', title: 'Page duplicated.' });
      router.push(`/${encodeURIComponent(workspaceName)}/page/${newPageId}`);
    } catch (error) {
      toast.add({
        type: 'error',
        title: errorMessage(error, 'Could not duplicate the page. Please try again.'),
      });
    }
  }

  async function handleSetPublished(next: boolean) {
    try {
      await setPublished({ workspaceName, pageId, isPublished: next });
      toast.add({
        type: 'success',
        title: next ? 'Page published.' : 'Page unpublished.',
      });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
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
          {page.isPublished ? (
            <>
              <DropdownMenuItem
                onClick={() => {
                  window.open(
                    `/p/${pageId}`,
                    '_blank',
                    'noopener,noreferrer'
                  );
                }}
              >
                <ExternalLinkIcon className='size-3' />
                Open published
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  handleSetPublished(false);
                }}
              >
                <GlobeIcon className='size-3' />
                Unpublish
              </DropdownMenuItem>
            </>
          ) : (
            <DropdownMenuItem
              onClick={() => {
                handleSetPublished(true);
              }}
            >
              <GlobeIcon className='size-3' />
              Publish
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

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
