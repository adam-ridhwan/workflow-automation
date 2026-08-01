'use client';

import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import {
  ArrowDownIcon,
  ArrowUpIcon,
  FolderPlusIcon,
  ListFilterIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from 'lucide-react';
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from 'next/navigation';

import { NewFolderDialog } from '../../_components/new-folder-dialog';
import { NewWorkflowDialog } from './new-workflow-dialog';

import type { Folder } from '@/convex/folders';

const FILTERS = [
  { value: 'all', label: 'All workflows' },
  { value: 'published', label: 'Published' },
  { value: 'unpublished', label: 'Unpublished' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'name', label: 'Name', short: 'Name' },
  { value: 'status', label: 'Status', short: 'Status' },
];

const ORDERS = [
  { value: 'asc', label: 'Ascending' },
  { value: 'desc', label: 'Descending' },
];

export function WorkflowsHeader() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const params = useParams<{ folderId?: Folder['_id'] }>();
  // Present on /workflows/folder/[folderId] routes; creation is scoped to
  // the folder being viewed.
  const folderId = params.folderId;
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [showNewFolderDialog, setShowNewFolderDialog] = useState(false);
  const searchDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  // Frozen at mount so the uncontrolled input's default doesn't change when
  // the debounced search updates the URL.
  const [initialQuery] = useState(() => searchParams.get('q') ?? '');

  const filter = searchParams.get('state') ?? 'all';
  const sort = searchParams.get('sort') ?? 'recent';
  const order = searchParams.get('order') ?? 'desc';

  /** Merge updates into the URL search params; `null` removes a param. */
  function updateParams(updates: Record<string, string | null>) {
    const next = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        next.delete(key);
      } else {
        next.set(key, value);
      }
    }
    const query = next.toString();
    router.replace(query ? `${pathname}?${query}` : pathname);
  }

  const hasActiveParams = ['state', 'sort', 'order', 'q'].some((key) =>
    searchParams.has(key)
  );

  function clearAll() {
    if (searchDebounce.current) {
      clearTimeout(searchDebounce.current);
    }
    if (searchInputRef.current) {
      searchInputRef.current.value = '';
    }
    router.replace(pathname);
  }

  const filterActive = filter !== 'all';
  const sortLabel = SORTS.find((s) => s.value === sort)?.short ?? 'Recent';

  return (
    <div
      className='bg-background flex h-13 shrink-0 items-center justify-between
        gap-3 border-b px-4'
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
              onValueChange={(value) =>
                updateParams({ state: value === 'all' ? null : value })
              }
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
            {order === 'asc' ? <ArrowUpIcon /> : <ArrowDownIcon />}
            {sortLabel}
          </DropdownMenuTrigger>
          <DropdownMenuContent align='start' className='w-46'>
            <DropdownMenuRadioGroup
              value={sort}
              onValueChange={(value) =>
                updateParams({ sort: value === 'recent' ? null : value })
              }
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
            <DropdownMenuSeparator />
            <DropdownMenuRadioGroup
              value={order}
              onValueChange={(value) =>
                updateParams({ order: value === 'desc' ? null : value })
              }
            >
              <DropdownMenuLabel
                className='text-muted-foreground text-[11.5px] font-normal'
              >
                Order
              </DropdownMenuLabel>
              {ORDERS.map((option) => (
                <DropdownMenuRadioItem key={option.value} value={option.value}>
                  {option.label}
                </DropdownMenuRadioItem>
              ))}
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        {hasActiveParams && (
          <Button
            type='button'
            variant='ghost'
            size='sm'
            className='text-muted-foreground h-8'
            onClick={clearAll}
          >
            <XIcon />
            Clear all
          </Button>
        )}
      </div>

      <div className='flex shrink-0 items-center gap-2'>
        <div className='relative'>
          <SearchIcon
            className='text-muted-foreground pointer-events-none absolute
              top-1/2 left-2.5 size-3.5 -translate-y-1/2'
          />
          <Input
            ref={searchInputRef}
            type='search'
            placeholder='Search workflows'
            defaultValue={initialQuery}
            onChange={(event) => {
              const value = event.target.value.trim();
              if (searchDebounce.current) {
                clearTimeout(searchDebounce.current);
              }
              searchDebounce.current = setTimeout(() => {
                updateParams({ q: value || null });
              }, 300);
            }}
            className='h-8 w-54 pl-8 text-[13px]'
          />
        </div>
        <Button
          variant='outline'
          size='sm'
          className='h-8'
          onClick={() => {
            setShowNewFolderDialog(true);
          }}
        >
          <FolderPlusIcon />
          New folder
        </Button>
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
        folderId={folderId}
        open={showNewDialog}
        onOpenChange={setShowNewDialog}
      />
      <NewFolderDialog
        parentId={folderId}
        open={showNewFolderDialog}
        onOpenChange={setShowNewFolderDialog}
      />
    </div>
  );
}
