'use client';

import { useParams } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

/** The workspace/workflow params from the current URL. `workspaceName` is
 * present throughout the `[workspaceName]` subtree; `workflowId` only on the
 * workflow detail route. */
export function useWorkspaceParams() {
  const params = useParams<{
    workspaceName: string;
    workflowId?: Id<'workflows'>;
  }>();
  return {
    workspaceName: decodeURIComponent(params.workspaceName),
    workflowId: params.workflowId,
  };
}

/** Like useWorkspaceParams, but fails fast when a workflow id isn't in the
 * route — for use inside the workflow detail subtree where both are required.
 */
export function useRequiredWorkspaceParams() {
  const { workspaceName, workflowId } = useWorkspaceParams();
  if (workflowId === undefined) {
    throw new Error(
      'useRequiredWorkspaceParams: workflowId is missing from the route.'
    );
  }
  return { workspaceName, workflowId };
}
