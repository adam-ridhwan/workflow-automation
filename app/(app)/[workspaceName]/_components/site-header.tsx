import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { NewItemMenu } from '../workflows/_components/new-item-menu';
import { WorkflowsHeader } from '../workflows/_components/workflows-header';
import { CollaboratorsMenu } from './collaborators-menu';

type SiteHeaderProps = {
  workspaceName: string;
  /** Server-rendered folder/workflow trail from the @breadcrumb slot. */
  breadcrumb?: React.ReactNode;
};

export async function SiteHeader({
  workspaceName,
  breadcrumb,
}: SiteHeaderProps) {
  const token = await convexAuthNextjsToken();
  const members = await fetchQuery(
    api.workspaces.members,
    { workspaceName },
    { token }
  );

  return (
    <header
      className='bg-background/60 flex h-14 shrink-0 items-center gap-2.5
        border-b px-3 supports-backdrop-filter:backdrop-blur-xl'
    >
      <SidebarTrigger className='size-8' />
      <Separator
        orientation='vertical'
        className='data-vertical:h-4.5 data-vertical:self-auto'
      />

      <div className='flex min-w-0 flex-1 items-center gap-1'>
        <NewItemMenu />
        {breadcrumb && (
          <nav
            aria-label='Breadcrumb'
            className='flex min-w-0 items-center gap-1 text-[13px]'
          >
            {breadcrumb}
          </nav>
        )}
      </div>

      <div className='flex shrink-0 items-center gap-2.5'>
        <WorkflowsHeader />
        <CollaboratorsMenu members={members} />
      </div>
    </header>
  );
}
