'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

type TrailStartProps = {
  workspaceName: string;
};

/** Leading separator + home link, rendered only when a trail exists. */
export function TrailStart({ workspaceName }: TrailStartProps) {
  return (
    <>
      <Separator
        orientation='vertical'
        className='mx-1.5 data-vertical:h-4.5 data-vertical:self-auto'
      />
      <Button
        variant='ghost'
        size='icon'
        nativeButton={false}
        className='text-muted-foreground hover:text-foreground'
        render={
          <Link
            href={`/${encodeURIComponent(workspaceName)}/workflows`}
            aria-label='Back to workflows'
          />
        }
      >
        <HomeIcon className='size-4' />
      </Button>
    </>
  );
}
