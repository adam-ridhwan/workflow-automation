import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/** Loading skeleton for the workspace overview — mirrors the real page's layout
 * so nothing shifts when data arrives: header, four stat cards, a runs chart
 * card, and a recent-activity card. */
export default function WorkspaceLoading() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      {/* Header: title + subtitle (no actions). */}
      <div className='flex min-w-0 flex-col gap-1.5'>
        <Skeleton className='h-[22px] w-28' />
        <Skeleton className='h-4 w-52' />
      </div>

      {/* Four stat cards. */}
      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        {Array.from({ length: 4 }, (_, index) => (
          <Card
            key={index}
            className='from-card to-muted gap-0 bg-gradient-to-b p-4'
          >
            <div className='flex items-center justify-between'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='size-4' />
            </div>
            <Skeleton className='mt-2 h-8 w-12' />
            <Skeleton className='mt-1 h-3 w-28' />
          </Card>
        ))}
      </div>

      {/* Runs chart card. */}
      <Card className='from-card to-muted bg-gradient-to-b'>
        <CardHeader>
          <Skeleton className='h-4 w-32' />
        </CardHeader>
        <CardContent>
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-4'>
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-20' />
            </div>
            <Skeleton className='h-44 w-full' />
          </div>
        </CardContent>
      </Card>

      {/* Recent activity card. */}
      <Card className='from-card to-muted bg-gradient-to-b'>
        <CardHeader>
          <Skeleton className='h-4 w-28' />
        </CardHeader>
        <CardContent>
          <ul className='flex flex-col'>
            {[40, 32, 44, 28, 36].map((width, index) => (
              <li key={index} className='flex items-center gap-3 py-2'>
                <Skeleton className='size-4 shrink-0' />
                <div className='min-w-0 flex-1'>
                  <Skeleton className='h-3.5' style={{ width: `${width}%` }} />
                </div>
                <Skeleton className='h-5 w-16 shrink-0 rounded-full' />
                <Skeleton className='h-3 w-16 shrink-0' />
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
