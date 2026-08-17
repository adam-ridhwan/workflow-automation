import { Button } from '@/components/ui/button';
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { LockIcon } from 'lucide-react';
import Link from 'next/link';

import type { Id } from '@/convex/_generated/dataModel';

type SettingsAdminRequiredProps = {
  workspaceId: Id<'workspaces'>;
  workspaceName: string;
};

/** Shown on admin-only settings pages when the viewer isn't the workspace
 * admin. */
export function SettingsAdminRequired({
  workspaceId,
  workspaceName,
}: SettingsAdminRequiredProps) {
  return (
    <Empty>
      <EmptyHeader>
        <EmptyMedia variant='icon'>
          <LockIcon />
        </EmptyMedia>
        <EmptyTitle>Admin access required</EmptyTitle>
        <EmptyDescription>
          Only the workspace admin can manage settings for {workspaceName}.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant='outline'
          size='sm'
          nativeButton={false}
          render={<Link href={`/workspace/${workspaceId}`} />}
        >
          Back to workspace
        </Button>
      </EmptyContent>
    </Empty>
  );
}
