import { Skeleton } from '@/components/ui/skeleton';

export default function FolderLoading() {
  return (
    <div className='flex flex-1 flex-col'>
      <div
        className='bg-background flex h-10 shrink-0 items-center gap-2 border-b
          px-5'
      >
        <Skeleton className='size-4 rounded-md' />
        <Skeleton className='h-3.5 w-28' />
        <Skeleton className='h-3.5 w-28' />
      </div>

      <div className='flex flex-col'>
        <div className='flex h-9 items-center border-b px-5'>
          <Skeleton className='h-3 w-24' />
        </div>
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className='flex items-center gap-2.5 border-b px-5 py-3'
          >
            <Skeleton className='size-4 rounded-md' />
            <Skeleton className='h-4 w-44' />
            <Skeleton className='ml-auto h-5 w-24 rounded-full' />
            <Skeleton className='h-3 w-20' />
            <Skeleton className='size-6 rounded-full' />
          </div>
        ))}
      </div>
    </div>
  );
}
