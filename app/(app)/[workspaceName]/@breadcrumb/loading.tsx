import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';

export default function BreadcrumbLoading() {
  return (
    <>
      <Separator
        orientation='vertical'
        className='mx-1.5 data-vertical:h-4.5 data-vertical:self-auto'
      />
      <Skeleton className='m-2 size-5 rounded-lg' />
      <Skeleton className='h-5 w-36 rounded-lg' />
    </>
  );
}
