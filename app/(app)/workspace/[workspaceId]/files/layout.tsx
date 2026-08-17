import { Table } from '@/components/ui/table';

import { ResourceTableHeader } from '../_components/resource-table-header';
import { FilesHeader } from './_components/files-header';

type FilesListLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// The column header lives here so it persists across list navigations
// instead of re-rendering with each page and its loading state. It is a
// separate header-only table; the body table mirrors its column widths with
// a colgroup, and table-fixed keeps the two aligned.
export default function FilesListLayout({ children }: FilesListLayoutProps) {
  return (
    <>
      <FilesHeader />
      <Table className='table-fixed'>
        <ResourceTableHeader
          labels={['Name', 'Status', 'Uploaded', 'Uploaded by']}
        />
      </Table>
      {children}
    </>
  );
}
