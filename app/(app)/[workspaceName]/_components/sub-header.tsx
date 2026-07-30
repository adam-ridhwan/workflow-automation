'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  ArrowUpDownIcon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
} from 'lucide-react';
import { usePathname } from 'next/navigation';

const SECTIONS = {
  workflows: {
    filterTitle: 'State',
    filters: [
      { value: 'all', label: 'All workflows' },
      { value: 'live', label: 'Live' },
      { value: 'draft', label: 'Draft' },
    ],
    searchPlaceholder: 'Search workflows',
    primaryLabel: 'New workflow',
  },
  files: {
    filterTitle: 'Status',
    filters: [
      { value: 'all', label: 'All files' },
      { value: 'indexed', label: 'Indexed' },
      { value: 'processing', label: 'Processing' },
      { value: 'failed', label: 'Failed' },
    ],
    searchPlaceholder: 'Search files',
    primaryLabel: 'Upload',
  },
} as const;

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'name', label: 'Name (A–Z)', short: 'Name' },
  { value: 'status', label: 'Status', short: 'Status' },
];

export function SubHeader() {
  const pathname = usePathname();
  const [filter, setFilter] = useState('all');
  const [sort, setSort] = useState('recent');

  const section = pathname.endsWith('/workflows')
    ? SECTIONS.workflows
    : pathname.endsWith('/files')
      ? SECTIONS.files
      : null;
  if (!section) {
    return null;
  }

  const filterActive = filter !== 'all';
  const sortLabel = SORTS.find((s) => s.value === sort)?.short ?? 'Recent';

  return (
    <div
      className='bg-background flex h-[52px] shrink-0 items-center
        justify-between gap-3 border-b px-5'
    >
      <div className='flex min-w-0 items-center gap-2'>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant='outline' size='sm' className='h-8' />}
          >
            <ListFilterIcon />
            Filter
            {filterActive && (
              <span
                className='bg-primary text-primary-foreground inline-flex
                  h-[17px] items-center rounded-full px-1.5 text-[10.5px]
                  font-semibold'
              >
                1
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-[184px]'>
            <DropdownMenuLabel
              className='text-muted-foreground text-[11.5px] font-normal'
            >
              {section.filterTitle}
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={filter} onValueChange={setFilter}>
              {section.filters.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant='outline' size='sm' className='h-8' />}
          >
            <ArrowUpDownIcon />
            {sortLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-[184px]'>
            <DropdownMenuLabel
              className='text-muted-foreground text-[11.5px] font-normal'
            >
              Sort by
            </DropdownMenuLabel>
            <DropdownMenuRadioGroup value={sort} onValueChange={setSort}>
              {SORTS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <div className='relative'>
          <SearchIcon
            className='text-muted-foreground pointer-events-none absolute
              top-1/2 left-2.5 size-3.5 -translate-y-1/2'
          />
          <Input
            type='search'
            placeholder={section.searchPlaceholder}
            className='h-8 w-[216px] pl-8 text-[13px]'
          />
        </div>
        <Button size='sm' className='h-8'>
          <PlusIcon />
          {section.primaryLabel}
        </Button>
      </div>
    </div>
  );
}
