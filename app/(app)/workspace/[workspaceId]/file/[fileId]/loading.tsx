import { Skeleton } from '@/components/ui/skeleton';

/** Mirrors the file viewer's layout (header bar + text lines) while the route
 * loads. */
export default function FileViewLoading() {
  return (
    <div className='flex min-h-0 flex-1 flex-col'>
      <div className='flex items-center gap-2.5 border-b px-2 py-4'>
        <Skeleton className='size-8 rounded-md' />
        <Skeleton className='size-4 rounded' />
        <Skeleton className='h-4 w-40' />
      </div>

      <div className='min-h-0 flex-1 space-y-2.5 p-6'>
        <Skeleton className='h-3.5 w-full' />
        <Skeleton className='h-3.5 w-11/12' />
        <Skeleton className='h-3.5 w-4/5' />
        <Skeleton className='h-3.5 w-full' />
        <Skeleton className='h-3.5 w-2/3' />
      </div>
    </div>
  );
}
