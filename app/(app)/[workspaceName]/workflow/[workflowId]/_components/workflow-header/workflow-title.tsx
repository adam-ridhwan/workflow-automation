import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import { notFound } from 'next/navigation';

import type { Id } from '@/convex/_generated/dataModel';
import type { Workflow } from '@/convex/workflows';

type WorkflowTitleProps = {
  workspaceName: string;
  workflowId: Id<'workflows'>;
};

/** Async server component: fetches and renders the workflow name. Wrapped in
 * Suspense by the layout so the header chrome paints immediately. */
export async function WorkflowTitle({
  workspaceName,
  workflowId,
}: WorkflowTitleProps) {
  const token = await convexAuthNextjsToken();
  let workflow: Workflow | null = null;
  try {
    workflow = await fetchQuery(
      api.workflows.get,
      { workspaceName, workflowId },
      { token }
    );
  } catch {
    notFound();
  }

  if (workflow === null) {
    notFound();
  }

  return (
    <span className='text-[13.5px] font-semibold tracking-tight'>
      {workflow.name}
    </span>
  );
}
