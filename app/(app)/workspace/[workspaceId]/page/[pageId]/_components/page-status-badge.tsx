'use client';

import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { errorMessage } from '@/lib/error-message';
import { useMutation, useQuery } from 'convex/react';

import { useCanWrite } from '../../../_hooks/use-can-write';
import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';

/** Publish-status control in the page header — a "Live" switch for owners, a
 * read-only badge for everyone else. Mirrors the workflow status toggle. */
export function PageStatusBadge() {
  const { workspaceId, pageId } = useWorkspaceParams();
  const page = useQuery(api.pages.get, { workspaceId, pageId });
  const setPublished = useMutation(api.pages.setPublished);
  const canWrite = useCanWrite();

  if (!page) {
    return null;
  }

  const isPublished = page.isPublished;
  const colorClassName = isPublished
    ? 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400'
    : 'bg-muted text-muted-foreground';

  if (!page.isOwner || !canWrite) {
    return (
      <Badge
        variant='secondary'
        className={cn('gap-1.5 rounded-full', colorClassName)}
      >
        <span className='size-1.25 rounded-full bg-current' />
        {isPublished ? 'Published' : 'Unpublished'}
      </Badge>
    );
  }

  async function handleSelect(nextPublished: boolean) {
    if (nextPublished === isPublished) {
      return;
    }
    try {
      await setPublished({ workspaceId, pageId, isPublished: nextPublished });
      toast.add({
        type: 'success',
        title: nextPublished ? 'Page is live.' : 'Page unpublished.',
      });
    } catch (error) {
      toast.add({
        type: 'error',
        title: errorMessage(
          error,
          'Could not update the page. Please try again.'
        ),
      });
    }
  }

  return (
    <label
      className='border-input flex cursor-pointer items-center gap-2 rounded-lg
        border px-2.5 py-1 text-sm select-none'
    >
      <Switch
        size='sm'
        checked={isPublished}
        onCheckedChange={(checked) => {
          handleSelect(checked);
        }}
        aria-label='Publish page'
      />
      <span
        className={cn(
          'font-medium',
          isPublished
            ? 'text-emerald-600 dark:text-emerald-400'
            : 'text-muted-foreground'
        )}
      >
        Live
      </span>
    </label>
  );
}
