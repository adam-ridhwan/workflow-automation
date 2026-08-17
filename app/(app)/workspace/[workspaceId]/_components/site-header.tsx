import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { CollaboratorsMenu } from './collaborators-menu';
import { SectionLabel } from './section-label';

import type { Id } from '@/convex/_generated/dataModel';
type SiteHeaderProps = {
  workspaceId: Id<'workspaces'>;
  /** Server-rendered folder/workflow trail from the @breadcrumb slot. */
  breadcrumb?: React.ReactNode;
  /** Route-specific header actions (e.g. the workflow live toggle + more-menu)
   * from the @headerActions slot; sits left of the collaborators menu. */
  headerActions?: React.ReactNode;
};

export async function SiteHeader({
  workspaceId,
  breadcrumb,
  headerActions,
}: SiteHeaderProps) {
  const token = await convexAuthNextjsToken();
  const [members, currentUser, workspace] = await Promise.all([
    fetchQuery(api.workspaces.members, { workspaceId }, { token }),
    fetchQuery(api.users.currentUser, {}, { token }),
    fetchQuery(api.workspaces.get, { workspaceId }, { token }),
  ]);

  return (
    <header
      className='bg-background/60 flex h-14 shrink-0 items-center
        justify-between border-b px-2 supports-backdrop-filter:backdrop-blur-xl'
    >
      <div className='flex min-w-0 flex-1 items-center gap-2.5'>
        <SidebarTrigger />
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

      <div className='flex shrink-0 items-center gap-1'>
        {headerActions}
        <CollaboratorsMenu
          members={members}
          currentUserId={currentUser?._id ?? null}
          adminId={workspace?.adminId ?? null}
        />
      </div>
    </header>
  );
}
