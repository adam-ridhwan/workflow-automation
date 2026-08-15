'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';
import { ConvexError } from 'convex/values';
import { useRouter, useSearchParams } from 'next/navigation';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { revalidatePages } from '../../pages/_lib/revalidate-pages';

import type { Folder } from '@/convex/folders';

/** Full-page "new page" experience: name a blank page, then land in its
 * builder. */
export default function CreatePagePage() {
  const { workspaceName } = useWorkspaceParams();
  const searchParams = useSearchParams();
  // Preserve folder scope when opened from a folder view.
  const folderId =
    (searchParams.get('folderId') as Folder['_id'] | null) ?? undefined;
  const router = useRouter();
  const createPage = useMutation(api.pages.create);

  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function createBlank(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed || busy) {
      return;
    }
    setBusy(true);
    try {
      const pageId = await createPage({
        workspaceName,
        name: trimmed,
        folderId,
      });
      await revalidatePages(workspaceName, folderId);
      router.replace(`/${encodeURIComponent(workspaceName)}/page/${pageId}`);
    } catch (error) {
      toast.add({
        type: 'error',
        title:
          error instanceof ConvexError && typeof error.data === 'string'
            ? error.data
            : 'Could not create page. Please try again.',
      });
      setBusy(false);
    }
  }

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10'>
        <div className='flex flex-col gap-1'>
          <h1 className='text-2xl font-semibold tracking-tight'>Create a page</h1>
          <p className='text-muted-foreground text-sm'>
            A customizable page where you drop inputs, a run button, and output
            displays, then bind them to a workflow.
          </p>
        </div>

        <form onSubmit={createBlank} className='flex items-center gap-2'>
          <Input
            value={name}
            onChange={(e) => {
              setName(e.target.value);
            }}
            placeholder='Page name'
            aria-label='Page name'
            className='min-w-0 flex-1'
            autoFocus
          />
          <Button
            type='submit'
            className='shrink-0'
            disabled={busy || name.trim().length === 0}
          >
            {busy ? 'Creating…' : 'Create'}
          </Button>
        </form>
      </div>
    </div>
  );
}
