'use client';

import { usePathname } from 'next/navigation';

export function SettingsSectionLabel() {
  const pathname = usePathname();
  const segments = pathname.split('/');
  const section = segments[segments.indexOf('settings') + 1];
  const label = section
    ? decodeURIComponent(section).charAt(0).toUpperCase() +
      decodeURIComponent(section).slice(1)
    : 'Settings';

  return (
    <span className='text-muted-foreground truncate text-[13px] font-medium'>
      {label}
    </span>
  );
}
