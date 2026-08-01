import { Skeleton } from '@/components/ui/skeleton';

export default function WorkflowLoading() {
  return (
    <div className='flex flex-1 flex-col'>
      <div
        className='bg-background flex h-13 shrink-0 items-center gap-3 border-b
          px-4'
      >
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-5 w-24 rounded-full' />
      </div>

      <div className='flex flex-col gap-2 p-5'>
        <Skeleton className='h-4 w-72' />
        <Skeleton className='h-3 w-48' />
      </div>
    </div>
  );
}
