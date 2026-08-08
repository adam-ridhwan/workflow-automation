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

type SettingsAdminRequiredProps = {
  workspaceName: string;
};

/** Shown on admin-only settings pages when the viewer isn't the workspace
 * admin. */
export function SettingsAdminRequired({
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
          render={<Link href={`/${encodeURIComponent(workspaceName)}`} />}
        >
          Back to workspace
        </Button>
      </EmptyContent>
    </Empty>
  );
}
