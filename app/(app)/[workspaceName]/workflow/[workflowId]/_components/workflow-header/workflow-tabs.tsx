'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
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
    <Tabs
      value={view}
      onValueChange={(value) => {
        if (value !== view) {
          router.push(`${base}/${value}`);
        }
      }}
    >
      <TabsList>
        <TabsTrigger value='canvas'>Canvas</TabsTrigger>
        <TabsTrigger value='run-history'>Runs</TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
