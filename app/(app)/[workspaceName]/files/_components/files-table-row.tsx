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
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatBytes } from '@/lib/format-bytes';
import { formatTime } from '@/lib/format-time';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import {
  DownloadIcon,
  EllipsisVerticalIcon,
  FileIcon,
  PencilIcon,
  Trash2Icon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

import { resourceRowComposer } from '../../_components/resource-row-composer';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { File, FileStatus } from '@/convex/files';

const FileRowComposer = resourceRowComposer<File>();

type FileRowProps = {
  file: File;
  onDelete: () => void;
};

const STATUS_STYLES: Record<
  FileStatus,
  { label: string; badgeClassName: string; barClassName: string }
> = {
  uploading: {
    label: 'Uploading',
    badgeClassName: 'bg-sky-500/15 text-sky-600 dark:text-sky-400',
    barClassName: 'bg-sky-500 dark:bg-sky-400',
  },
  assembling: {
    label: 'Assembling',
    badgeClassName: 'bg-violet-500/15 text-violet-600 dark:text-violet-400',
    barClassName: 'bg-violet-500 dark:bg-violet-400',
  },
  processing: {
    label: 'Processing',
    badgeClassName: 'bg-amber-500/15 text-amber-600 dark:text-amber-400',
    barClassName: 'bg-amber-500 dark:bg-amber-400',
  },
  indexed: {
    label: 'Indexed',
    badgeClassName: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
    barClassName: '',
  },
  failed: {
    label: 'Failed',
    badgeClassName: 'bg-destructive/15 text-destructive',
    barClassName: '',
  },
};

export function FileRow({ file, onDelete }: FileRowProps) {
  const { workspaceName } = useWorkspaceParams();
  const router = useRouter();
  const renameFile = useMutation(api.files.rename);

  // Inline-rename state, owned here and handed to the composer's NameCell.
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
    if (nextName.length === 0 || nextName === file.name) {
      stopRename();
      return;
    }
    try {
      await renameFile({ workspaceName, fileId: file._id, name: nextName });
      stopRename();
      router.refresh();
    } catch (err) {
      setRenameError(
        err instanceof ConvexError && typeof err.data === 'string'
          ? err.data
          : 'Could not rename file. Please try again.'
      );
    }
  }

  // Text files open in the in-app viewer; anything else opens its raw storage
  // URL in a new tab.
  const isText =
    file.contentType === 'text/plain' ||
    file.name.toLowerCase().endsWith('.txt');
  const viewHref = `/${encodeURIComponent(workspaceName)}/file/${file._id}`;

  const status = STATUS_STYLES[file.status];
  const isAssembling = file.status === 'assembling';
  // The upload transfer and the indexing pass both show a live bar; assembling
  // is a brief server step with no client-visible percentage.
  const inProgress =
    file.status === 'uploading' || isAssembling || file.status === 'processing';
  const barWidth = isAssembling ? 100 : file.progress;

  return (
    <FileRowComposer.Provider resource={file}>
      <FileRowComposer.Row
        drag={{ kind: 'file', id: file._id, name: file.name }}
        dragDisabled={isRenaming}
      >
        <FileRowComposer.NameCell
          icon={<FileIcon className='text-muted-foreground size-4 shrink-0' />}
          name={file.name}
          subtitle={formatBytes(file.size)}
          href={isText ? viewHref : (file.url ?? undefined)}
          hrefExternal={!isText}
          isRenaming={isRenaming}
          renameError={renameError}
          onRenameSubmit={submitRename}
          onRenameCancel={stopRename}
        />

        <FileRowComposer.Cell>
          {inProgress ? (
            <span className='flex max-w-36 flex-col gap-1.5'>
              <Badge
                variant='secondary'
                className={cn('gap-1.5 rounded-full', status.badgeClassName)}
              >
                <span
                  className='size-1.25 animate-pulse rounded-full bg-current'
                />
                {isAssembling
                  ? 'Assembling…'
                  : `${status.label} ${file.progress}%`}
              </Badge>
              <span className='bg-muted h-1 w-full overflow-hidden rounded-full'>
                <span
                  className={cn(
                    'block h-full rounded-full transition-[width] duration-300',
                    status.barClassName,
                    isAssembling && 'animate-pulse'
                  )}
                  style={{ width: `${barWidth}%` }}
                />
              </span>
            </span>
          ) : (
            <Badge
              variant='secondary'
              className={cn('gap-1.5 rounded-full', status.badgeClassName)}
            >
              <span className='size-1.25 rounded-full bg-current' />
              {status.label}
            </Badge>
          )}
        </FileRowComposer.Cell>

        <FileRowComposer.Cell className='text-muted-foreground text-xs'>
          {formatTime(file._creationTime)}
        </FileRowComposer.Cell>

        <FileRowComposer.Cell>
          <span className='flex min-w-0 items-center gap-2'>
            <UserAvatar
              user={{
                name: file.uploadedByName,
                email: file.uploadedByEmail,
                avatar: file.uploadedByImageUrl ?? undefined,
              }}
              size='sm'
              className='relative'
              fallbackClassName='text-[10px] font-semibold'
            />
            <span className='truncate text-xs'>{file.uploadedByName}</span>
          </span>
        </FileRowComposer.Cell>

        <FileRowComposer.Actions>
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type='button'
                  variant='ghost'
                  size='icon'
                  className='text-muted-foreground relative size-7'
                  aria-label={`Actions for ${file.name}`}
                />
              }
            >
              <EllipsisVerticalIcon className='size-4' />
            </DropdownMenuTrigger>
            <DropdownMenuContent align='end' className='w-46'>
              {file.url && (
                <>
                  <DropdownMenuItem
                    render={
                      <a
                        href={file.url}
                        download={file.name}
                        target='_blank'
                        rel='noreferrer'
                      />
                    }
                  >
                    <DownloadIcon className='size-3' />
                    Download
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />
                </>
              )}

              <DropdownMenuItem onClick={startRename}>
                <PencilIcon className='size-3' />
                Rename file
              </DropdownMenuItem>

              <DropdownMenuItem onClick={onDelete}>
                <Trash2Icon className='size-3' />
                Delete file
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </FileRowComposer.Actions>
      </FileRowComposer.Row>
    </FileRowComposer.Provider>
  );
}
