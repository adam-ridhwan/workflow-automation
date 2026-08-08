'use client';

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { usePathname, useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

/** Canvas / Runs switcher that navigates between the two workflow routes. */
export function WorkflowTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();

  const base = `/${encodeURIComponent(workspaceName)}/workflow/${workflowId}`;
  const view = pathname.includes('/run-history') ? 'run-history' : 'canvas';

  return (
    <ToggleGroup
      variant='outline'
      size='sm'
      spacing={0}
      value={[view]}
      onValueChange={(groupValue) => {
        const next = groupValue[0];
        if (next !== undefined && next !== view) {
          router.push(`${base}/${next}`);
        }
      }}
    >
      <ToggleGroupItem value='canvas'>Canvas</ToggleGroupItem>
      <ToggleGroupItem value='run-history'>Runs</ToggleGroupItem>
    </ToggleGroup>
  );
}
