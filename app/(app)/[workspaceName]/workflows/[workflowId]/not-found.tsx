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
import { SearchXIcon } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function WorkflowNotFound() {
  const params = useParams<{ workspaceName: string }>();
  const workspaceName = decodeURIComponent(params.workspaceName);

  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <SearchXIcon />
        </EmptyMedia>
        <EmptyTitle>Workflow not found</EmptyTitle>
        <EmptyDescription>This workflow does not exist.</EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant='outline'
          size='sm'
          nativeButton={false}
          render={
            <Link href={`/${encodeURIComponent(workspaceName)}/workflows`} />
          }
        >
          Back to workflows
        </Button>
      </EmptyContent>
    </Empty>
  );
}
