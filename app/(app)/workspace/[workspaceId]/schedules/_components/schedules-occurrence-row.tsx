'use client';

import { WorkflowIcon } from 'lucide-react';

import { resourceRowComposer } from '../../_components/resource-row-composer';
import { useWorkspaceParams } from '../../_hooks/use-workspace-params';
import { formatTimeOfDay } from '../_lib/occurrences';

import { describeCron } from '@/lib/cron';

import type { Occurrence } from '../_lib/occurrences';

const OccurrenceRow = resourceRowComposer<Occurrence>();

type SchedulesOccurrenceRowProps = {
  occurrence: Occurrence;
};

export function SchedulesOccurrenceRow({
  occurrence,
}: SchedulesOccurrenceRowProps) {
  const { workspaceId } = useWorkspaceParams();

  return (
    <OccurrenceRow.Provider resource={occurrence}>
      <OccurrenceRow.Row
        drag={{
          kind: 'workflow',
          id: occurrence.workflowId,
          name: occurrence.workflowName,
        }}
        dragDisabled
      >
        <OccurrenceRow.NameCell
          icon={
            <WorkflowIcon className='text-muted-foreground size-4 shrink-0' />
          }
          name={occurrence.workflowName}
          subtitle={describeCron(occurrence.cron)}
          href={`/workspace/${workspaceId}/workflow/${occurrence.workflowId}/canvas`}
        />
        <OccurrenceRow.Cell className='text-muted-foreground text-xs tabular-nums'>
          {formatTimeOfDay(occurrence.at)}
        </OccurrenceRow.Cell>
        <OccurrenceRow.Cell className='text-muted-foreground text-xs'>
          {occurrence.timezone}
        </OccurrenceRow.Cell>
        <OccurrenceRow.Cell>{null}</OccurrenceRow.Cell>
        <OccurrenceRow.Actions>{null}</OccurrenceRow.Actions>
      </OccurrenceRow.Row>
    </OccurrenceRow.Provider>
  );
}
