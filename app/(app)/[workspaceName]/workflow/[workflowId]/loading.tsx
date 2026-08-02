import { Skeleton } from '@/components/ui/skeleton';

export default function WorkflowLoading() {
  return (
    <div className='flex flex-1 flex-col'>
      <div
        className='bg-background flex h-13 shrink-0 items-center gap-3 border-b
          px-2'
      >
        <Skeleton className='size-8 rounded-lg' />
        <Skeleton className='h-4 w-40' />
        <Skeleton className='h-5 w-24 rounded-full' />
      </div>

      <div
        className='relative min-h-0 flex-1 overflow-hidden
          [background-image:radial-gradient(var(--color-border)_1px,transparent_1px)]
          [background-size:12px_12px]'
      >
        <div
          className='menu-inverted bg-popover ring-foreground/10 absolute
            bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-1
            rounded-lg p-1 shadow-md ring-1 backdrop-blur-xl'
        >
          <Skeleton className='size-7 rounded-md' />
          <Skeleton className='h-7 w-13 rounded-md' />
          <Skeleton className='size-7 rounded-md' />
          <Skeleton className='size-7 rounded-md' />
          <Skeleton className='size-7 rounded-md' />
        </div>
      </div>
    </div>
  );
}
