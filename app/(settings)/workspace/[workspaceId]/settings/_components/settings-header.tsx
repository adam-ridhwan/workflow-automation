import { ChevronRightIcon } from 'lucide-react';

import { SettingsSectionLabel } from './settings-section-label';

type SettingsHeaderProps = {
  workspaceName: string;
};

export function SettingsHeader({ workspaceName }: SettingsHeaderProps) {
  return (
    <header
      className='bg-background/60 flex h-14 shrink-0 items-center
        justify-between border-b px-5 supports-backdrop-filter:backdrop-blur-xl'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2.5'>
        <span
          className='text-[15px] font-semibold tracking-tight whitespace-nowrap'
        >
          {workspaceName}
        </span>
        <ChevronRightIcon className='text-muted-foreground size-3.5 shrink-0' />
        <SettingsSectionLabel />
      </div>
    </header>
  );
}
