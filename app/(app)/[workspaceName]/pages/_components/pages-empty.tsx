'use client';

import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { LayoutTemplateIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { useWorkspaceParams } from '../../_hooks/use-workspace-params';

export function PagesEmpty() {
  const { workspaceName } = useWorkspaceParams();
  const createHref = `/${encodeURIComponent(workspaceName)}/page/create`;

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <LayoutTemplateIcon />
        </EmptyMedia>
        <EmptyTitle>No pages yet</EmptyTitle>
        <EmptyDescription>
          Build a customizable page of inputs and outputs, then bind it to a
          workflow.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size='sm' nativeButton={false} render={<Link href={createHref} />}>
          <PlusIcon />
          New page
        </Button>
      </EmptyContent>
    </Empty>
  );
}
