import { sieveResources } from '../../_lib/sieve-resources';

import type { ResourceSearchParams } from '../../_lib/sieve-resources';
import type { Page } from '@/convex/pages';

export type PagesSearchParams = ResourceSearchParams & {
  state?: 'bound' | 'unbound';
};

export function sievePages(pages: Page[], searchParams: PagesSearchParams) {
  return sieveResources(pages, searchParams, {
    matchesState: (page, state) =>
      state === 'bound'
        ? page.workflowId !== undefined
        : page.workflowId === undefined,
    searchFields: (page) => [page.name, page.workflowName],
    comparators: {
      name: (a, b) => a.name.localeCompare(b.name),
      workflow: (a, b) =>
        (a.workflowName ?? '').localeCompare(b.workflowName ?? ''),
    },
  });
}
