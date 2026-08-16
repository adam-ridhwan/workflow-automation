'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';

import { ResourceListToolbar } from '../../_components/resource-list-toolbar';
import { AddScheduleDialog } from './add-schedule-dialog';

const FILTERS = [
  { value: 'all', label: 'All schedules' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
];

const SORTS = [
  { value: 'recent', label: 'Most recent', short: 'Recent' },
  { value: 'next', label: 'Next run', short: 'Next' },
  { value: 'name', label: 'Name', short: 'Name' },
];

export function SchedulesHeader() {
  const [showAdd, setShowAdd] = useState(false);

  return (
    <ResourceListToolbar
      searchPlaceholder='Search schedules'
      filterGroupLabel='Status'
      filters={FILTERS}
      sorts={SORTS}
      trailing={
        <>
          <Button
            size='sm'
            className='h-8'
            onClick={() => {
              setShowAdd(true);
            }}
          >
            <PlusIcon />
            Add schedule
          </Button>
          <AddScheduleDialog open={showAdd} onOpenChange={setShowAdd} />
        </>
      }
    />
  );
}
