import { TrailSegment } from '../../_components/trail-segment';
import { TrailStart } from '../../_components/trail-start';

type CreateBreadcrumbPageProps = {
  params: Promise<{ workspaceName: string }>;
};

/** Breadcrumb for the "new workflow" route: home → New workflow. A static
 * `create` segment also keeps the slot from matching it as a `[workflowId]`. */
export default async function CreateBreadcrumbPage({
  params,
}: CreateBreadcrumbPageProps) {
  const { workspaceName } = await params;
  return (
    <>
      <TrailStart section='workflows' />
      <TrailSegment
        name='New workflow'
        href={`/${encodeURIComponent(workspaceName)}/workflow/create`}
        icon='workflow'
        isCurrent
      />
    </>
  );
}
