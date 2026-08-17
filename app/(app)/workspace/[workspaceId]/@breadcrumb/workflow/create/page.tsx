import { TrailSegment } from '../../_components/trail-segment';
import { TrailStart } from '../../_components/trail-start';

import type { Id } from '@/convex/_generated/dataModel';
type CreateBreadcrumbPageProps = {
  params: Promise<{ workspaceId: string }>;
};

/** Breadcrumb for the "new workflow" route: home → New workflow. A static
 * `create` segment also keeps the slot from matching it as a `[workflowId]`. */
export default async function CreateBreadcrumbPage({
  params,
}: CreateBreadcrumbPageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  return (
    <>
      <TrailStart section='workflows' />
      <TrailSegment
        name='New workflow'
        href={`/workspace/${workspaceId}/workflow/create`}
        icon='workflow'
        isCurrent
      />
    </>
  );
}
