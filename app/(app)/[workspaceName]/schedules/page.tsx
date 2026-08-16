import { api } from '@/convex/_generated/api';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';

import { SchedulesTable } from './_components/schedules-table';
import { sieveSchedules } from './_lib/sieve-schedules';

import type { SchedulesSearchParams } from './_lib/sieve-schedules';

type SchedulesPageProps = {
  params: Promise<{ workspaceName: string }>;
  searchParams: Promise<SchedulesSearchParams>;
};

export default async function SchedulesPage({
  params,
  searchParams,
}: SchedulesPageProps) {
  const { workspaceName } = await params;
  const decodedWorkspaceName = decodeURIComponent(workspaceName);
  const { state, sort, order, q } = await searchParams;

  const token = await convexAuthNextjsToken();
  const schedules = await fetchQuery(
    api.schedules.listForWorkspace,
    { workspaceName: decodedWorkspaceName },
    { token }
  );

  const sieved = sieveSchedules(schedules, { state, sort, order, q });
  const isFiltered = Boolean(state || q);

  return <SchedulesTable schedules={sieved} isFiltered={isFiltered} />;
}
