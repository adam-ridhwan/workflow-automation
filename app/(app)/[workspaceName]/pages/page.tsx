import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { LayoutTemplateIcon, PlusIcon } from 'lucide-react';
import Link from 'next/link';

import { PagesTable } from './_components/pages-table';

type PagesPageProps = {
  params: Promise<{ workspaceName: string }>;
};

export default async function PagesPage({ params }: PagesPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const token = await convexAuthNextjsToken();
  const pages = await fetchQuery(
    api.pages.list,
    { workspaceName: decodedWorkspaceName },
    { token }
  );

  const createHref = `/${encodeURIComponent(decodedWorkspaceName)}/page/create`;

  if (pages.length === 0) {
    return (
      <div className='min-h-0 flex-1 overflow-y-auto'>
        <Empty className='py-20'>
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
            <Button render={<Link href={createHref} />} nativeButton={false}>
              <PlusIcon />
              New page
            </Button>
          </EmptyContent>
        </Empty>
      </div>
    );
  }

  return (
    <div className='min-h-0 flex-1 overflow-y-auto'>
      <div className='mx-auto flex w-full max-w-5xl flex-col gap-4 px-6 py-8'>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col gap-1'>
            <h1 className='text-xl font-semibold tracking-tight'>Pages</h1>
            <p className='text-muted-foreground text-sm'>
              Customizable UI pages bound to your workflows.
            </p>
          </div>
          <Button
            size='sm'
            render={<Link href={createHref} />}
            nativeButton={false}
          >
            <PlusIcon />
            New page
          </Button>
        </div>
        <PagesTable pages={pages} />
      </div>
    </div>
  );
}
