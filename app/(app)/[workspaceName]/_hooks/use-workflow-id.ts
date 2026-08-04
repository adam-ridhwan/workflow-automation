'use client';

import { useParams } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';

/** The workflow id from the current URL. */
export function useWorkflowId() {
  const params = useParams<{ workflowId: Id<'workflows'> }>();
  return params.workflowId;
}
