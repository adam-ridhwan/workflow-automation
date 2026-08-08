'use client';

import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { HistoryIcon, WorkflowIcon } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';

import { useWorkspaceParams } from '../../../../_hooks/use-workspace-params';

/** Canvas / Runs switcher that navigates between the two workflow routes. The
 * Runs tab shows how many times the workflow has run. */
export function WorkflowTabs() {
  const router = useRouter();
  const pathname = usePathname();
  const { workspaceName, workflowId } = useWorkspaceParams();
  const workflow = useQuery(api.workflows.get, { workspaceName, workflowId });
  const runCount = workflow?.runCount ?? 0;

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
        <TabsTrigger value='canvas'>
          <WorkflowIcon className='size-3' />
          Canvas
        </TabsTrigger>

        <TabsTrigger value='run-history'>
          <HistoryIcon className='size-3' />
          Runs
          {runCount > 0 && (
            <span
              className='bg-foreground/5 rounded px-1 py-px text-[10px]
                font-medium tabular-nums'
            >
              {runCount}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
