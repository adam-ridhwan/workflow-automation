import { Skeleton } from '@/components/ui/skeleton';

import { ResourceTableSkeleton } from './_components/resource-table-skeleton';

export default function WorkspaceLoading() {
  return (
    <div className='flex flex-1 flex-col'>
      <div
        className='bg-background flex h-13 shrink-0 items-center justify-between
          gap-3 border-b px-5'
      >
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-20' />
          <Skeleton className='h-8 w-24' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-8 w-54' />
          <Skeleton className='h-8 w-27' />
          <Skeleton className='h-8 w-31' />
        </div>
      </div>

      <div className='bg-sidebar flex h-9 shrink-0 items-center border-b px-5'>
        <Skeleton className='h-3 w-24' />
      </div>
      <ResourceTableSkeleton rows={4} />
    </div>
  );
}
