import { Table } from '@/components/ui/table';

import { ResourceTableHeader } from '../_components/resource-table-header';
import { PagesHeader } from './_components/pages-header';

type PagesListLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

// The column header lives here so it persists across list navigations instead
// of re-rendering with each page and its loading state.
export default function PagesListLayout({ children }: PagesListLayoutProps) {
  return (
    <>
      <PagesHeader />
      <Table className='table-fixed'>
        <ResourceTableHeader labels={['Name', 'Workflow', 'Created', 'Owner']} />
      </Table>
      {children}
    </>
  );
}
