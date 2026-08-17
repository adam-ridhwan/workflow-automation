'use client';

import {
  CalendarClockIcon,
  FolderIcon,
  LayoutDashboardIcon,
  LayoutTemplateIcon,
  WorkflowIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

function sectionFromPathname(pathname: string) {
  // /workspace/<id>/<section>/… -> the 4th split segment is the section
  // (split on '/' yields a leading '' before 'workspace').
  const [, , , section] = pathname.split('/');
  switch (section) {
    case 'workflows':
      return { label: 'Workflows', Icon: WorkflowIcon };

    case 'workflow':
      return { label: 'Workflow', Icon: WorkflowIcon };

    case 'files':
      return { label: 'Files', Icon: FolderIcon };

    case 'file':
      return { label: 'File', Icon: FolderIcon };

    case 'pages':
      return { label: 'Pages', Icon: LayoutTemplateIcon };

    case 'page':
      return { label: 'Page', Icon: LayoutTemplateIcon };

    case 'schedules':
      return { label: 'Schedules', Icon: CalendarClockIcon };

    default:
      return { label: 'Overview', Icon: LayoutDashboardIcon };
  }
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
