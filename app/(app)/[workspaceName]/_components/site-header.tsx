import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { CollaboratorsMenu } from './collaborators-menu';
import { SectionLabel } from './section-label';

type SiteHeaderProps = {
  workspaceName: string;
};

export async function SiteHeader({ workspaceName }: SiteHeaderProps) {
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
        <span
          className='text-[15px] font-semibold tracking-tight whitespace-nowrap'
        >
          {workspaceName}
        </span>
        <SectionLabel />
      </div>

      <CollaboratorsMenu members={members} />
    </header>
  );
}
