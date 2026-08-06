'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useRequiredWorkspaceParams } from '../../../_hooks/use-workspace-params';

/** The workflow's latest run, streamed live over Convex's websocket while
 * the backend executes — one shared subscription across all consumers. */
export function useWorkflowRun() {
  const { workspaceName, workflowId } = useRequiredWorkspaceParams();
  return useQuery(api.runs.get, { workspaceName, workflowId });
}
