import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { cn } from '@/lib/cn';
import { formatTime } from '@/lib/format-time';
import { convexAuthNextjsToken } from '@convex-dev/auth/nextjs/server';
import { fetchQuery } from 'convex/nextjs';
import {
  CircleCheckIcon,
  FileIcon,
  PlayIcon,
  WorkflowIcon,
} from 'lucide-react';
import Link from 'next/link';

import { OverviewRunsChart } from './_components/overview-runs-chart';
import { OverviewStatCard } from './_components/overview-stat-card';

import type { Id } from '@/convex/_generated/dataModel';

type WorkspacePageProps = {
  params: Promise<{ workspaceId: string }>;
};

const RUN_STATUS: Record<
  'success' | 'error' | 'stopped',
  { label: string; className: string }
> = {
  success: {
    label: 'Success',
    className: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  },
  error: {
    label: 'Error',
    className: 'bg-destructive/15 text-destructive',
  },
  stopped: {
    label: 'Stopped',
    className: 'bg-muted text-muted-foreground',
  },
};

export default async function WorkspacePage({ params }: WorkspacePageProps) {
  const { workspaceId: workspaceIdParam } = await params;
  const workspaceId = workspaceIdParam as Id<'workspaces'>;

  const token = await convexAuthNextjsToken();
  const [overview, runsSeries] = await Promise.all([
    fetchQuery(api.overview.get, { workspaceId: workspaceId }, { token }),
    fetchQuery(
      api.overview.runsSeries,
      { workspaceId: workspaceId },
      { token }
    ),
  ]);

  if (overview === null) {
    return null;
  }

  const { workflows, runs, files, recentRuns } = overview;

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='min-w-0'>
        <h1 className='text-lg font-semibold tracking-tight'>Overview</h1>
        <p className='text-muted-foreground text-[13px]'>
          A snapshot of {overview.name}.
        </p>
      </div>

      <div className='grid gap-4 sm:grid-cols-2 lg:grid-cols-4'>
        <OverviewStatCard
          label='Workflows'
          value={workflows.total}
          sub={`${workflows.published} published · ${workflows.unpublished} draft`}
          icon={<WorkflowIcon />}
        />
        <OverviewStatCard
          label='Total runs'
          value={runs.total}
          sub={`${runs.success} succeeded · ${runs.failed} failed`}
          icon={<PlayIcon />}
        />
        <OverviewStatCard
          label='Success rate'
          value={runs.successRate === null ? '—' : `${runs.successRate}%`}
          sub='across all runs'
          icon={<CircleCheckIcon />}
        />
        <OverviewStatCard
          label='Files'
          value={files.total}
          sub={`${files.indexed} indexed`}
          icon={<FileIcon />}
        />
      </div>

      <Card className='from-card to-muted bg-gradient-to-b'>
        <CardHeader>
          <CardTitle className='text-sm'>Runs · last 14 days</CardTitle>
        </CardHeader>
        <CardContent>
          <OverviewRunsChart data={runsSeries} />
        </CardContent>
      </Card>

      <Card className='from-card to-muted bg-gradient-to-b'>
        <CardHeader>
          <CardTitle className='text-sm'>Recent activity</CardTitle>
        </CardHeader>
        <CardContent>
          {recentRuns.length === 0 ? (
            <p className='text-muted-foreground py-6 text-center text-[13px]'>
              No runs yet. Run a workflow to see activity here.
            </p>
          ) : (
            <ul className='flex flex-col'>
              {recentRuns.map((run) => {
                const status = RUN_STATUS[run.status];
                return (
                  <li key={run.workflowId}>
                    <Link
                      href={`/workspace/${workspaceId}/workflow/${run.workflowId}/canvas`}
                      className='hover:bg-muted/60 -mx-2 flex items-center gap-3
                        rounded-md px-2 py-2'
                    >
                      <WorkflowIcon
                        className='text-muted-foreground size-4 shrink-0'
                      />
                      <span
                        className='min-w-0 flex-1 truncate text-[13px]
                          font-medium'
                      >
                        {run.workflowName}
                      </span>
                      <span
                        className={cn(
                          `inline-flex shrink-0 items-center gap-1.5
                            rounded-full px-2 py-0.5 text-[11px] font-medium`,
                          status.className
                        )}
                      >
                        <span className='size-1.25 rounded-full bg-current' />
                        {status.label}
                      </span>
                      <span
                        className='text-muted-foreground w-24 shrink-0
                          text-right text-xs'
                      >
                        {formatTime(run.ranAt)}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
