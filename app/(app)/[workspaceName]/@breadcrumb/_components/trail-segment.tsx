'use client';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/cn';
import { ChevronRightIcon, FolderIcon, WorkflowIcon } from 'lucide-react';
import Link from 'next/link';

type TrailSegmentProps = {
  name: string;
  href: string;
  icon: 'folder' | 'workflow';
  isCurrent: boolean;
};

export function TrailSegment({
  name,
  href,
  icon,
  isCurrent,
}: TrailSegmentProps) {
  const Icon = icon === 'folder' ? FolderIcon : WorkflowIcon;
  return (
    <span className='flex min-w-0 items-center gap-1'>
      <ChevronRightIcon className='text-muted-foreground size-3 shrink-0' />
      <Button
        variant='ghost'
        nativeButton={false}
        render={
          <Link href={href} aria-current={isCurrent ? 'page' : undefined} />
        }
        className={cn(
          'min-w-0 gap-1.5 px-2 text-[13px]',
          isCurrent
            ? 'font-semibold tracking-tight'
            : 'text-muted-foreground hover:text-foreground font-medium'
        )}
      >
        <Icon className='size-3.5 shrink-0' />
        <span className='truncate'>{name}</span>
      </Button>
    </span>
  );
}
