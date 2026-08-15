'use client';

import { useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { errorMessage } from '@/lib/error-message';
import { useMutation } from 'convex/react';
import { CopyIcon, MoreHorizontalIcon, Trash2Icon } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { revalidatePages } from '../_lib/revalidate-pages';

import type { Page } from '@/convex/pages';

type PagesTableProps = {
  pages: Page[];
};

function formatDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function PagesTable({ pages }: PagesTableProps) {
  const { workspaceName } = useWorkspaceParams();
  const router = useRouter();
  const duplicatePage = useMutation(api.pages.duplicate);
  const removePage = useMutation(api.pages.remove);
  const [pendingDelete, setPendingDelete] = useState<Page | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function handleDuplicate(page: Page) {
    try {
      await duplicatePage({ workspaceName, pageId: page._id });
      await revalidatePages(workspaceName);
      router.refresh();
      toast.add({ type: 'success', title: 'Page duplicated.' });
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    }
  }

  async function handleDelete() {
    if (!pendingDelete) {
      return;
    }
    setDeleting(true);
    try {
      await removePage({ workspaceName, pageId: pendingDelete._id });
      setPendingDelete(null);
      await revalidatePages(workspaceName);
      router.refresh();
    } catch (error) {
      toast.add({ type: 'error', title: errorMessage(error) });
    } finally {
      setDeleting(false);
    }
  }

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Workflow</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Updated</TableHead>
            <TableHead className='w-10' />
          </TableRow>
        </TableHeader>
        <TableBody>
          {pages.map((page) => (
            <TableRow key={page._id}>
              <TableCell className='font-medium'>
                <Link
                  href={`/${encodeURIComponent(workspaceName)}/page/${page._id}`}
                  className='hover:underline'
                >
                  {page.name}
                </Link>
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {page.workflowId ? (
                  'Bound'
                ) : (
                  <span className='italic'>Unbound</span>
                )}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {page.ownerName}
              </TableCell>
              <TableCell className='text-muted-foreground'>
                {formatDate(page.updatedAt)}
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant='ghost' size='icon-sm'>
                        <MoreHorizontalIcon />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align='end'>
                    <DropdownMenuItem
                      onClick={() => {
                        handleDuplicate(page);
                      }}
                    >
                      <CopyIcon />
                      Duplicate
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      variant='destructive'
                      onClick={() => {
                        setPendingDelete(page);
                      }}
                    >
                      <Trash2Icon />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingDelete(null);
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {pendingDelete?.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently deletes the page. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className='bg-destructive hover:bg-destructive/90 text-white'
            >
              {deleting ? 'Deleting…' : 'Delete page'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
