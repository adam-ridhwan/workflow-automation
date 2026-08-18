'use client';

import { ResourceTable } from '../../_components/resource-table';
import { SchedulesTableRow } from './schedules-table-row';

import type { WorkflowScheduleWithWorkflow } from '@/convex/schedules';

type SchedulesTableProps = {
  schedules: WorkflowScheduleWithWorkflow[];
  isFiltered: boolean;
};

export function SchedulesTable({
  schedules,
  isFiltered,
}: SchedulesTableProps) {
  return (
    <ResourceTable
      isFiltered={isFiltered}
      isEmpty={schedules.length === 0}
      emptyMessage='No schedules yet. Add one to run a workflow automatically.'
    >
      {schedules.map((schedule) => (
        <SchedulesTableRow key={schedule._id} schedule={schedule} />
      ))}
    </ResourceTable>
  );
}
