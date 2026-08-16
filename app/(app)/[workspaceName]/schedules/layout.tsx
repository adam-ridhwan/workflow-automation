import { Table } from '@/components/ui/table';

import { ResourceTableHeader } from '../_components/resource-table-header';
import { SchedulesHeader } from './_components/schedules-header';

type SchedulesListLayoutProps = Readonly<{
  children: React.ReactNode;
}>;

export default function SchedulesListLayout({
  children,
}: SchedulesListLayoutProps) {
  return (
    <>
      <SchedulesHeader />
      <Table className='table-fixed'>
        <ResourceTableHeader
          labels={['Workflow', 'Next run', 'Last run', 'Status']}
        />
      </Table>
      {children}
    </>
  );
}
