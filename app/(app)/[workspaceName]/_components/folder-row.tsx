'use client';

import { TableCell } from '@/components/ui/table';
import { UserAvatar } from '@/components/user-avatar';
import { api } from '@/convex/_generated/api';
import { formatTime } from '@/lib/format-time';
import { useMutation } from 'convex/react';
import { FolderIcon } from 'lucide-react';

import { useWorkspaceParams } from '../_hooks/use-workspace-params';
import { ResourceRowShell } from './resource-row-shell';

import type { Folder } from '@/convex/folders';

type FolderRowProps = {
  folder: Folder;
  onDelete: () => void;
};

/** A folder row for either the workflows or the files table. Links into the
 * folder within its own section (folders never mix the two kinds). */
export function FolderRow({ folder, onDelete }: FolderRowProps) {
  const { workspaceName } = useWorkspaceParams();
  const renameFolder = useMutation(api.folders.rename);

  const section = folder.kind === 'file' ? 'files' : 'workflows';
  const href = `/${encodeURIComponent(workspaceName)}/${section}/folder/${folder._id}`;

  return (
    <ResourceRowShell
      drag={{ kind: 'folder', id: folder._id, name: folder.name }}
      drop={{ folderId: folder._id, folderName: folder.name }}
      href={href}
      icon={
        <FolderIcon
          className='text-muted-foreground size-4 shrink-0 fill-current'
        />
      }
      name={folder.name}
      onRename={(name) =>
        renameFolder({ workspaceName, folderId: folder._id, name })
      }
      renameLabel='Rename folder'
      renameErrorFallback='Could not rename folder. Please try again.'
      deleteLabel='Delete folder'
      onDelete={onDelete}
      cells={
        <>
          <TableCell className='text-muted-foreground px-5 text-xs'>
            —
          </TableCell>
          <TableCell className='text-muted-foreground px-5 text-xs'>
            {formatTime(folder._creationTime)}
          </TableCell>
          <TableCell className='px-5'>
            <span className='flex min-w-0 items-center gap-2'>
              <UserAvatar
                user={{
                  name: folder.createdByName,
                  email: folder.createdByEmail,
                  avatar: folder.createdByImageUrl ?? undefined,
                }}
                size='sm'
                className='relative'
                fallbackClassName='text-[10px] font-semibold'
              />
              <span className='truncate text-xs'>{folder.createdByName}</span>
            </span>
          </TableCell>
        </>
      }
    />
  );
}
