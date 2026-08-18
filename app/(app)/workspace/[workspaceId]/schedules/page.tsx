import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { SchedulesCalendar } from './_components/schedules-calendar';
import { sieveSchedules } from './_lib/sieve-schedules';

import type { SchedulesSearchParams } from './_lib/sieve-schedules';
import type { Id } from '@/convex/_generated/dataModel';

type SchedulesPageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<SchedulesSearchParams>;
};

export default async function SchedulesPage({
  params,
  searchParams,
}: SchedulesPageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const schedules = await fetchQuery(
    api.schedules.listForWorkspace,
    { workspaceId: workspaceId },
    { token }
  );

  const sieved = sieveSchedules(schedules, { state, sort, order, q });

  return <SchedulesCalendar schedules={sieved} />;
}
