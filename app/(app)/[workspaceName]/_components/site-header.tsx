import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { CollaboratorsMenu } from './collaborators-menu';
import { SectionLabel } from './section-label';

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
      className='bg-background/60 flex h-14 shrink-0 items-center
        justify-between border-b px-5 supports-backdrop-filter:backdrop-blur-xl'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2.5'>
        <SidebarTrigger className='-ml-1.5' />
        <Separator
          orientation='vertical'
          className='data-vertical:h-4.5 data-vertical:self-auto'
        />

        <SectionLabel />
        {breadcrumb && (
          <nav
            aria-label='Breadcrumb'
            className='flex min-w-0 items-center gap-1 text-[13px]'
          >
            {breadcrumb}
          </nav>
        )}
      </div>

      <CollaboratorsMenu workspaceName={workspaceName} members={members} />
    </header>
  );
}
