import { Skeleton } from '@/components/ui/skeleton';

import { WorkflowsTableSkeleton } from './[workspaceName]/workflows/_components/workflows-table-skeleton';

export default function AppLoading() {
  return (
    <div className='flex min-h-svh w-full'>
      <div className='bg-sidebar hidden w-64 shrink-0 flex-col border-r md:flex'>
        <div className='flex h-14 shrink-0 items-center gap-2 border-b px-3'>
          <Skeleton className='size-6 rounded-md' />
          <Skeleton className='h-4 w-24' />
        </div>
        <div className='flex flex-col gap-3 p-4'>
          <Skeleton className='h-3 w-16' />
          <Skeleton className='h-4 w-28' />
          <Skeleton className='h-4 w-20' />
        </div>
        <div className='mt-auto flex items-center gap-2 p-3'>
          <Skeleton className='size-7 rounded-full' />
          <div className='flex flex-col gap-1'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-2.5 w-32' />
          </div>
        </div>
      </div>

      <div className='flex min-w-0 flex-1 flex-col'>
        <div
          className='flex h-14 shrink-0 items-center justify-between border-b
            px-5'
        >
          <div className='flex items-center gap-2.5'>
            <Skeleton className='size-6 rounded-md' />
            <Skeleton className='h-5 w-28' />
          </div>
          <Skeleton className='size-7 rounded-full' />
        </div>

        <div
          className='flex h-13 shrink-0 items-center justify-between gap-3
            border-b px-5'
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

        <WorkflowsTableSkeleton rows={4} />
      </div>
    </div>
  );
}
