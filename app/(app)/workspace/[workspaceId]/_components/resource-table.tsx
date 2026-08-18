'use client';

import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

type ResourceTableProps = {
  isFiltered: boolean;
  /** Whether there are no rows at all (no folders and no items). */
  isEmpty: boolean;
  emptyMessage: string;
  /** The folder and entity rows, all rendered by the caller. */
  children: React.ReactNode;
};

/** The shared table shell for the workflows, files, pages, and schedules lists:
 * a fixed-layout table of the caller's rows (folders and entities) with an empty
 * state. The caller renders its own rows and owns any delete dialogs. */
export function ResourceTable({
  isFiltered,
  isEmpty,
  emptyMessage,
  children,
}: ResourceTableProps) {
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
            children
          )}
        </TableBody>
      </Table>
    </div>
  );
}
