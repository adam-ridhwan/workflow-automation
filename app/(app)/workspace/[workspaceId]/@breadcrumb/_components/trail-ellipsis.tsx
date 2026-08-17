'use client';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ChevronRightIcon, EllipsisIcon, FolderIcon } from 'lucide-react';
import Link from 'next/link';

type TrailEllipsisProps = {
  segments: { id: string; name: string; href: string }[];
};

/** Collapsed middle of a deep trail; opens a menu of the hidden folders. */
export function TrailEllipsis({ segments }: TrailEllipsisProps) {
  return (
    <span className='flex items-center gap-1'>
      <ChevronRightIcon className='text-muted-foreground size-3 shrink-0' />
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type='button'
              variant='ghost'
              size='icon'
              className='text-muted-foreground'
              aria-label='Show hidden folders'
            />
          }
        >
          <EllipsisIcon className='size-3.5' />
        </DropdownMenuTrigger>
        <DropdownMenuContent align='start' className='w-48'>
          {segments.map((segment) => (
            <DropdownMenuItem
              key={segment.id}
              nativeButton={false}
              render={<Link href={segment.href} />}
            >
              <FolderIcon />
              {segment.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  );
}
