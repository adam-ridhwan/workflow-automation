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
      <Link
        href={href}
        aria-current={isCurrent ? 'page' : undefined}
        className={
          isCurrent
            ? 'flex min-w-0 items-center gap-1.5 font-semibold tracking-tight'
            : `text-muted-foreground hover:text-foreground flex min-w-0
              items-center gap-1.5 font-medium transition-colors`
        }
      >
        <Icon className='size-3.5 shrink-0' />
        <span className='truncate'>{name}</span>
      </Link>
    </span>
  );
}
