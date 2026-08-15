'use client';

import { Button } from '@/components/ui/button';
import { PencilIcon, PlayIcon } from 'lucide-react';

import { PageMoreMenu } from '../../page/[pageId]/_components/page-more-menu';
import { usePageStore } from '../../page/[pageId]/_store/page-store';

/** The page builder's Edit/Preview toggle, rendered into the site header via the
 * `@headerActions` parallel-route slot (left of the collaborators menu). Mode
 * lives in the shared page store so this slot and the builder stay in sync. */
export function PageHeaderActionsSlot() {
  const mode = usePageStore((s) => s.mode);
  const setMode = usePageStore((s) => s.setMode);

  return (
    <>
      <div className='bg-muted flex items-center gap-0.5 rounded-lg p-0.5'>
        <Button
          size='sm'
          variant={mode === 'edit' ? 'outline' : 'ghost'}
          onClick={() => {
            setMode('edit');
          }}
        >
          <PencilIcon />
          Edit
        </Button>
        <Button
          size='sm'
          variant={mode === 'preview' ? 'outline' : 'ghost'}
          onClick={() => {
            setMode('preview');
          }}
        >
          <PlayIcon />
          Preview
        </Button>
      </div>
      <PageMoreMenu />
    </>
  );
}
