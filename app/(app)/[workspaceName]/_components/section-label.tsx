'use client';

import { ChevronRightIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

function sectionFromPathname(pathname: string) {
  if (pathname.endsWith('/workflows')) {
    return 'Workflows';
  }
  if (pathname.endsWith('/files')) {
    return 'Files';
  }
  return 'Overview';
}

export function SectionLabel() {
  const pathname = usePathname();

  return (
    <>
      <ChevronRightIcon className='text-muted-foreground size-3.5 shrink-0' />
      <span className='text-muted-foreground truncate text-[13px] font-medium'>
        {sectionFromPathname(pathname)}
      </span>
    </>
  );
}
