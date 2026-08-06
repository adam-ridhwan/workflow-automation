'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useWorkflowId } from '../../../_hooks/use-workflow-id';
import { useWorkspaceName } from '../../../_hooks/use-workspace-name';

/** The workflow's latest run, streamed live over Convex's websocket while
 * the backend executes — one shared subscription across all consumers. */
export function useWorkflowRun() {
  const workspaceName = useWorkspaceName();
  const workflowId = useWorkflowId();
  return useQuery(api.runs.get, { workspaceName, workflowId });
}
