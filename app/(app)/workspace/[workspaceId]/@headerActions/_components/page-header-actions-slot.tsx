'use client';

import { PageMoreMenu } from '../../page/[pageId]/_components/page-more-menu';
import { PageStatusBadge } from '../../page/[pageId]/_components/page-status-badge';

/** The page's publish (Live) toggle and more-menu, rendered into the site header
 * via the `@headerActions` parallel-route slot (left of the collaborators
 * menu). The Edit/Preview toggle lives in the builder toolbar. */
export function PageHeaderActionsSlot() {
  return (
    <>
      <PageStatusBadge />
      <PageMoreMenu />
    </>
  );
}
