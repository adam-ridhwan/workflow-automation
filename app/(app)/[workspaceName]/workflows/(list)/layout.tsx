import { Table } from '@/components/ui/table';

import { WorkflowsTableHeader } from '../_components/workflows-table-header';

type WorkflowsListLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// The column header lives here so it persists across list navigations
// instead of re-rendering with each page and its loading state. It is a
// separate header-only table; the body table mirrors its column widths with
// a colgroup, and table-fixed keeps the two aligned.
export default function WorkflowsListLayout({
  children,
}: WorkflowsListLayoutProps) {
  return (
    <>
      <Table className='table-fixed'>
        <WorkflowsTableHeader />
      </Table>
      {children}
    </>
  );
}
