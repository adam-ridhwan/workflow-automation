'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { TableCell } from '@/components/ui/table';
import { EllipsisVerticalIcon, PencilIcon, Trash2Icon } from 'lucide-react';

type ResourceRowActionsProps = {
  /** Row name, used to label the trigger for assistive tech. */
  name: string;
  /** Puts the row into inline-rename mode (owned by ResourceRowShell). */
  onStartRename: () => void;
  renameLabel: string;
  onDelete: () => void;
  deleteLabel: string;
  /** Extra menu items inserted between Rename and Delete. */
  children?: React.ReactNode;
};

/** The kebab actions cell shared by workflow, file, and folder rows: a
 * more-menu with Rename, any caller-supplied items, and Delete. Passed to
 * `ResourceRowShell` via its `actions` render prop so each row can compose its
 * own items while the shell keeps ownership of the rename input state. */
export function ResourceRowActions({
  name,
  onStartRename,
  renameLabel,
  onDelete,
  deleteLabel,
  children,
}: ResourceRowActionsProps) {
  return (
    <TableCell className='px-5'>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground relative size-7'
              aria-label={`Actions for ${name}`}
            />
          }
        >
          <EllipsisVerticalIcon className='size-4' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='end' className='w-46'>
          <DropdownMenuItem onClick={onStartRename}>
            <PencilIcon />
            {renameLabel}
          </DropdownMenuItem>
          {children}
          <DropdownMenuItem onClick={onDelete}>
            <Trash2Icon />
            {deleteLabel}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </TableCell>
  );
}
