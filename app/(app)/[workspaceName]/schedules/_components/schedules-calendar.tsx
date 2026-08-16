'use client';

import { useMemo, useState } from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Table } from '@/components/ui/table';
import {
  addMonths,
  endOfMonth,
  isSameDay,
  startOfMonth,
  subMonths,
} from 'date-fns';

import { ResourceTable } from '../../_components/resource-table';
import { ResourceTableHeader } from '../../_components/resource-table-header';
import { computeOccurrences } from '../_lib/occurrences';
import { SchedulesOccurrenceRow } from './schedules-occurrence-row';

import type { WorkflowScheduleWithWorkflow } from '@/convex/schedules';

type SchedulesCalendarProps = {
  schedules: WorkflowScheduleWithWorkflow[];
};

export function SchedulesCalendar({ schedules }: SchedulesCalendarProps) {
  const [month, setMonth] = useState(() => new Date());
  const [selected, setSelected] = useState<Date | undefined>(() => new Date());

  const today = new Date();
  const startBound = subMonths(startOfMonth(today), 3);
  const endBound = endOfMonth(addMonths(today, 3));

  const occurrences = useMemo(
    () => computeOccurrences(schedules, startOfMonth(month), endOfMonth(month)),
    [schedules, month]
  );

  const scheduledDays = useMemo(
    () => occurrences.map((occurrence) => occurrence.at),
    [occurrences]
  );

  const selectedOccurrences = useMemo(() => {
    if (!selected) {
      return [];
    }
    return occurrences
      .filter((occurrence) => isSameDay(occurrence.at, selected))
      .sort((a, b) => a.at.getTime() - b.at.getTime());
  }, [occurrences, selected]);

  return (
    <div className='flex min-h-0 flex-1'>
      <div className='flex shrink-0 flex-col border-r'>
        <h3 className='border-b px-4 py-3 text-center text-sm font-semibold tracking-tight'>
          {selected
            ? selected.toLocaleDateString(undefined, {
                weekday: 'long',
                month: 'long',
                day: 'numeric',
              })
            : 'Select a day'}
        </h3>
        <div className='p-4'>
          <Calendar
            className='p-0'
            mode='single'
            month={month}
            onMonthChange={setMonth}
            selected={selected}
            onSelect={setSelected}
            startMonth={startBound}
            endMonth={endBound}
            modifiers={{ scheduled: scheduledDays }}
            modifiersClassNames={{
              scheduled:
                "relative after:absolute after:bottom-1 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-primary after:content-['']",
            }}
          />
        </div>
      </div>

      <div className='flex min-h-0 flex-1 flex-col'>
        <Table className='table-fixed'>
          <ResourceTableHeader labels={['Workflow', 'Time', 'Timezone', '']} />
        </Table>

        <ResourceTable
          folders={[]}
          itemCount={selectedOccurrences.length}
          itemNoun='run'
          itemNounPlural='runs'
          isFiltered={false}
          emptyMessage='No scheduled runs this day.'
        >
          {selectedOccurrences.map((occurrence, index) => (
            <SchedulesOccurrenceRow
              key={`${occurrence.workflowId}-${index}`}
              occurrence={occurrence}
            />
          ))}
        </ResourceTable>
      </div>
    </div>
  );
}
