import { Skeleton } from '@/components/ui/skeleton';

export default function SettingsLoading() {
  return (
    <div className='flex flex-col gap-8'>
      <div className='flex flex-col gap-2'>
        <Skeleton className='h-6 w-32' />
        <Skeleton className='h-4 w-64' />
      </div>

      {/* Avatar / logo row */}
      <div className='flex flex-col gap-3'>
        <Skeleton className='h-4 w-28' />
        <div className='flex items-center gap-4'>
          <Skeleton className='size-14 rounded-full' />
          <Skeleton className='h-8 w-20 rounded-md' />
        </div>
      </div>

      {/* Name field */}
      <div className='flex flex-col gap-3'>
        <Skeleton className='h-4 w-16' />
        <Skeleton className='h-9 w-full max-w-sm rounded-md' />
        <Skeleton className='h-8 w-16 rounded-md' />
      </div>
    </div>
  );
}
