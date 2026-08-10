'use client';

import { useState } from 'react';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

import { useWorkspaceParams } from '../_hooks/use-workspace-params';
import { DeleteFolderDialog } from './delete-folder-dialog';
import { FolderRow } from './folder-row';

import type { Folder } from '@/convex/folders';

type ResourceTableProps = {
  folders: Folder[];
  itemCount: number;
  itemNoun: string;
  itemNounPlural: string;
  isFiltered: boolean;
  emptyMessage: string;
  /** The entity rows (workflows or files), already rendered by the caller. */
  children: React.ReactNode;
};

/** The shared table shell for the workflows and files lists: a fixed-layout
 * table of folder rows followed by the caller's entity rows, an empty state,
 * a footer count, and the folder-delete confirmation. The caller owns its own
 * entity-delete dialog. */
export function ResourceTable({
  folders,
  itemCount,
  itemNoun,
  itemNounPlural,
  isFiltered,
  emptyMessage,
  children,
}: ResourceTableProps) {
  const { workspaceName } = useWorkspaceParams();
  const [folderDeleteTarget, setFolderDeleteTarget] = useState<Folder | null>(
    null
  );

  const isEmpty = folders.length === 0 && itemCount === 0;

  return (
    <div className='flex flex-1 flex-col'>
      <Table className='table-fixed'>
        <colgroup>
          <col />
          <col className='w-[15%]' />
          <col className='w-[15%]' />
          <col className='w-[15%]' />
          <col className='w-[5%]' />
        </colgroup>

        <TableBody>
          {isEmpty ? (
            <TableRow className='hover:bg-transparent'>
              <TableCell
                colSpan={5}
                className='text-muted-foreground h-24 px-5 text-center
                  text-[13px]'
              >
                {isFiltered
                  ? 'Nothing matches your search or filters. Try broadening or clearing them.'
                  : emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            <>
              {folders.map((folder) => (
                <FolderRow
                  key={folder._id}
                  folder={folder}
                  onDelete={() => {
                    setFolderDeleteTarget(folder);
                  }}
                />
              ))}
              {children}
            </>
          )}
        </TableBody>
      </Table>

      <div
        className='text-muted-foreground mt-auto flex h-10.5 items-center
          justify-between border-t px-5 text-[11.5px]'
      >
        <span>
          {itemCount} {itemCount === 1 ? itemNoun : itemNounPlural} in{' '}
          {workspaceName}
        </span>
      </div>

      <DeleteFolderDialog
        folder={folderDeleteTarget}
        onOpenChange={(open) => {
          if (!open) {
            setFolderDeleteTarget(null);
          }
        }}
      />
    </div>
  );
}
