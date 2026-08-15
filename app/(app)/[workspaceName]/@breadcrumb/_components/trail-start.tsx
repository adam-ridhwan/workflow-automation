'use client';

import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/cn';
import { useDroppable } from '@dnd-kit/core';
import { HomeIcon } from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

import type { DropTargetData } from '../../_components/workspace-dnd-provider';

type TrailStartProps = {
  /** Which section's root the home link returns to. */
  section?: 'workflows' | 'files' | 'pages';
};

/** Leading separator + home link, rendered only when a trail exists. Also a
 * drop target for moving items back to the workspace root. */
export function TrailStart({ section = 'workflows' }: TrailStartProps) {
  const { workspaceName } = useWorkspaceParams();
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
            href={`/${encodeURIComponent(workspaceName)}/${section}`}
            aria-label={`Back to ${section}`}
          />
        }
      >
        <HomeIcon className='size-4' />
      </Button>
    </>
  );
}
