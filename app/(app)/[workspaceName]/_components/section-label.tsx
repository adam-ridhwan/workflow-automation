'use client';

import { FolderIcon, LayoutDashboardIcon, WorkflowIcon } from 'lucide-react';
import { usePathname } from 'next/navigation';

function sectionFromPathname(pathname: string) {
  const [, , section] = pathname.split('/');
  if (section === 'workflows') {
    return { label: 'Workflows', Icon: WorkflowIcon };
  }
  if (section === 'files') {
    return { label: 'Files', Icon: FolderIcon };
  }
  return { label: 'Overview', Icon: LayoutDashboardIcon };
}

export function SectionLabel() {
  const pathname = usePathname();
  const { label, Icon } = sectionFromPathname(pathname);

  return (
    <span className='text-primary flex min-w-0 items-center gap-1.5'>
      <Icon className='size-4 shrink-0' />
      <span className='truncate text-lg font-medium'>{label}</span>
    </span>
  );
}
