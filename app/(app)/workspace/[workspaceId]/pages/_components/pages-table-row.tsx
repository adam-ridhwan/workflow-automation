'use client';

import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/toast';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { formatTime } from '@/lib/format-time';
import { useMutation } from 'convex/react';
import {
  CopyIcon,
  EllipsisVerticalIcon,
  LayoutTemplateIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { revalidatePages } from '../_lib/revalidate-pages';
import { resourceRowComposer } from '../../_components/resource-row-composer';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { Page } from '@/convex/pages';

const PageRow = resourceRowComposer<Page>();

type PagesTableRowProps = {
  page: Page;
  onDelete: () => void;
};

export function PagesTableRow({ page, onDelete }: PagesTableRowProps) {
  const { workspaceId } = useWorkspaceParams();
  const router = useRouter();
  const renamePage = useMutation(api.pages.rename);
  const duplicatePage = useMutation(api.pages.duplicate);

  const [isRenaming, setIsRenaming] = useState(false);
  const [renameError, setRenameError] = useState<string | null>(null);

  function startRename() {
    setRenameError(null);
    setIsRenaming(true);
  }

  function stopRename() {
    setIsRenaming(false);
    setRenameError(null);
  }

  async function submitRename(rawName: string) {
    const nextName = rawName.trim();
    if (nextName.length === 0 || nextName === page.name) {
      stopRename();
      return;
    }
    try {
      await renamePage({ workspaceId, pageId: page._id, name: nextName });
      stopRename();
      router.refresh();
    } catch (err) {
      setRenameError(
        errorMessage(err, 'Could not rename page. Please try again.')
      );
    }
  }

  async function handleDuplicate() {
    try {
      await duplicatePage({ workspaceId, pageId: page._id });
      await revalidatePages(workspaceId);
      router.refresh();
      toast.add({ type: 'success', title: 'Page duplicated.' });
    } catch (err) {
      toast.add({ type: 'error', title: errorMessage(err) });
    }
  }

  return (
    <PageRow.Provider resource={page}>
      <PageRow.Row
        drag={{ kind: 'page', id: page._id, name: page.name }}
        dragDisabled={isRenaming}
      >
        <PageRow.NameCell
          icon={
            <LayoutTemplateIcon
              className='text-muted-foreground size-4 shrink-0'
            />
          }
          name={page.name}
          href={`/workspace/${workspaceId}/page/${page._id}`}
          isRenaming={isRenaming}
          renameError={renameError}
          onRenameSubmit={submitRename}
          onRenameCancel={stopRename}
        />

        <PageRow.Cell>
          <Badge
            variant='secondary'
            className={cn(
              'gap-1.5 rounded-full',
              page.isPublished
                ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
                : 'bg-muted text-muted-foreground'
            )}
          >
            <span className='size-1.25 rounded-full bg-current' />
            {page.isPublished ? 'Published' : 'Unpublished'}
          </Badge>
        </PageRow.Cell>

        <PageRow.Cell className='text-muted-foreground text-xs'>
          {formatTime(page._creationTime)}
        </PageRow.Cell>

        <PageRow.Cell>
          <span className='flex min-w-0 items-center gap-2'>
            <UserAvatar
              user={{
                name: page.ownerName,
                email: page.ownerEmail,
                avatar: page.ownerImageUrl ?? undefined,
              }}
              size='sm'
              className='relative'
              fallbackClassName='text-[10px] font-semibold'
            />
            <span className='truncate text-xs'>{page.ownerName}</span>
          </span>
        </PageRow.Cell>

        <PageRow.Actions>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground relative size-7'
                  aria-label={`Actions for ${page.name}`}
                />
              }
            >
              <EllipsisVerticalIcon className='size-4' />
            </DropdownMenuTrigger>

            <DropdownMenuContent align='end' className='w-46'>
              <DropdownMenuItem onClick={startRename}>
                <PencilIcon className='size-3' />
                Rename page
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDuplicate}>
                <CopyIcon className='size-3' />
                Duplicate
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem onClick={onDelete}>
                <Trash2Icon className='size-3' />
                Delete page
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PageRow.Actions>
      </PageRow.Row>
    </PageRow.Provider>
  );
}
