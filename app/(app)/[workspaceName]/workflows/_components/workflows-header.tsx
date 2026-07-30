'use client';

import { useRef, useState } from 'react';
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
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { NewWorkflowDialog } from './new-workflow-dialog';

const FILTERS = [
  { value: 'all', label: 'All workflows' },
  { value: 'live', label: 'Live' },
  { value: 'canvas', label: 'Canvas' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'name', label: 'Name (A–Z)', short: 'Name' },
  { value: 'status', label: 'Status', short: 'Status' },
];

export function WorkflowsHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ workspaceName: string }>();
  const workspaceName = decodeURIComponent(params.workspaceName);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Frozen at mount so the uncontrolled input's default doesn't change when
  // the debounced search updates the URL.
  const [initialQuery] = useState(() => searchParams.get('q') ?? '');

  const filter = searchParams.get('state') ?? 'all';
  const sort = searchParams.get('sort') ?? 'recent';

  function setParam(key: string, value: string, defaultValue: string) {
    const next = new URLSearchParams(searchParams);
    if (value === defaultValue) {
      next.delete(key);
    } else {
      next.set(key, value);
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const filterActive = filter !== 'all';
  const sortLabel = SORTS.find((s) => s.value === sort)?.short ?? 'Recent';

  return (
    <div
      className='bg-background flex h-13 shrink-0 items-center justify-between
        gap-3 border-b px-5'
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
                className='bg-primary text-primary-foreground inline-flex h-4.25
                  items-center rounded-full px-1.5 text-[10.5px] font-semibold'
              >
                1
              </span>
            )}
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-46'>
            <DropdownMenuRadioGroup
              value={filter}
              onValueChange={(value) => setParam('state', value, 'all')}
            >
              <DropdownMenuLabel
                className='text-muted-foreground text-[11.5px] font-normal'
              >
                State
              </DropdownMenuLabel>
              {FILTERS.map((option) => (
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
          <DropdownMenuContent align='start' className='w-46'>
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) => setParam('sort', value, 'recent')}
            >
              <DropdownMenuLabel
                className='text-muted-foreground text-[11.5px] font-normal'
              >
                Sort by
              </DropdownMenuLabel>
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
            placeholder='Search workflows'
            defaultValue={initialQuery}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (searchDebounce.current) {
                clearTimeout(searchDebounce.current);
              }
              searchDebounce.current = setTimeout(() => {
                setParam('q', value, '');
              }, 300);
            }}
            className='h-8 w-54 pl-8 text-[13px]'
          />
        </div>
        <Button
          size='sm'
          className='h-8'
          onClick={() => {
            setShowNewDialog(true);
          }}
        >
          <PlusIcon />
          New workflow
        </Button>
      </div>

      <NewWorkflowDialog
        workspaceName={workspaceName}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
    </div>
  );
}
