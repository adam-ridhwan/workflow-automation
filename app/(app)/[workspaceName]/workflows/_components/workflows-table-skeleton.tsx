import { Skeleton } from '@/components/ui/skeleton';
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table';

type WorkflowsTableSkeletonProps = {
  rows?: number;
};

// A real table with the same colgroup as WorkflowsTable, so skeleton cells
// line up exactly with the persistent column header and the loaded rows.
export function WorkflowsTableSkeleton({
  rows = 4,
}: WorkflowsTableSkeletonProps) {
  return (
    <Table className='table-fixed'>
      <colgroup>
        <col />
        <col className='w-[15%]' />
        <col className='w-[15%]' />
        <col className='w-[15%]' />
        <col className='w-[5%]' />
      </colgroup>
      <TableBody>
        {Array.from({ length: rows }, (_, index) => (
          <TableRow key={index} className='h-14 hover:bg-transparent'>
            <TableCell className='px-5'>
              <span className='flex items-center gap-2.5'>
                <Skeleton className='size-4 rounded-md' />
                <Skeleton className='h-4 w-44 max-w-full' />
              </span>
            </TableCell>
            <TableCell className='px-5'>
              <Skeleton className='h-5 w-24 max-w-full rounded-full' />
            </TableCell>
            <TableCell className='px-5'>
              <Skeleton className='h-3 w-20 max-w-full' />
            </TableCell>
            <TableCell className='px-5'>
              <Skeleton className='size-6 rounded-full' />
            </TableCell>
            <TableCell className='px-5' />
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}
