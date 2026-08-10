import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export default function WorkspaceLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex flex-col gap-2'>
          <Skeleton className='h-5 w-28' />
          <Skeleton className='h-3.5 w-48' />
        </div>
        <div className='flex gap-2'>
          <Skeleton className='h-8 w-28' />
          <Skeleton className='h-8 w-32' />
        </div>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Card key={index} className='gap-0 p-4'>
            <Skeleton className='h-3 w-20' />
            <Skeleton className='mt-3 h-7 w-14' />
            <Skeleton className='mt-2 h-3 w-28' />
          </Card>
        ))}
      </div>

      <div className='grid gap-4 lg:grid-cols-3'>
        <Card className='h-56 lg:col-span-2' />
        <Card className='h-56' />
      </div>
    </div>
  );
}
