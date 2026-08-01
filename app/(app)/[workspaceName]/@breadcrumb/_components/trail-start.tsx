'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useWorkspaceName } from '@/hooks/use-workspace-name';
import { cn } from '@/lib/cn';
import { useDroppable } from '@dnd-kit/core';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

import type { DropTargetData } from '../../_components/workspace-dnd-provider';

/** Leading separator + home link, rendered only when a trail exists. Also a
 * drop target for moving items back to the workspace root. */
export function TrailStart() {
  const workspaceName = useWorkspaceName();
  const { setNodeRef, isOver } = useDroppable({
    id: 'trail-home',
    data: {
      folderId: undefined,
      folderName: 'the workspace root',
    } satisfies DropTargetData,
  });

  return (
    <>
      <Separator
        orientation='vertical'
        className='mx-1.5 data-vertical:h-4.5 data-vertical:self-auto'
      />
      <Button
        ref={setNodeRef}
        variant='ghost'
        size='icon'
        nativeButton={false}
        className={cn(
          'text-muted-foreground hover:text-foreground',
          isOver && 'bg-muted text-foreground'
        )}
        render={
          <Link
            href={`/${encodeURIComponent(workspaceName)}/workflows`}
            aria-label='Back to workflows'
          />
        }
      >
        <HomeIcon className='size-4' />
      </Button>
    </>
  );
}
