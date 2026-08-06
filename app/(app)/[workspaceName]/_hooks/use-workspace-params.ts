'use client';

import { useParams } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

/**
 * Workspace/workflow params from the current URL, read fail-fast:
 * `workspaceName` is validated immediately (present throughout the
 * `[workspaceName]` subtree), and `workflowId` throws when accessed on a route
 * that doesn't have it — i.e. outside the workflow detail subtree — so callers
 * never silently get `undefined`.
 */
export function useWorkspaceParams() {
  const params = useParams<{
    workspaceName: string;
    workflowId?: Id<'workflows'>;
    runHistoryId?: Id<'runHistory'>;
  }>();

  if (params.workspaceName === undefined) {
    throw new Error(
      'useWorkspaceParams: workspaceName is missing from the route.'
    );
  }
  const workspaceName = decodeURIComponent(params.workspaceName);

  return {
    workspaceName,
    // Only present on the run-history detail route; stays undefined elsewhere.
    runHistoryId: params.runHistoryId,
    get workflowId(): Id<'workflows'> {
      if (params.workflowId === undefined) {
        throw new Error(
          'useWorkspaceParams: workflowId is missing from the route.'
        );
      }
      return params.workflowId;
    },
  };
}
