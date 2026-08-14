import { cronJobs } from 'convex/server';

import { internal } from './_generated/api';

const crons = cronJobs();

// Single dispatcher: every minute, fire any workflow schedules that are due.
// Per-workflow schedules live in the `workflowSchedules` table (Convex crons
// are static, so we can't register one per workflow).
crons.interval(
  'dispatch workflow schedules',
  { minutes: 1 },
  internal.scheduleDispatch.dispatch,
  {}
);

export default crons;
