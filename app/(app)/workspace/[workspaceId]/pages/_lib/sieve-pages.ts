import { sieveResources } from '../../_lib/sieve-resources';

import type { ResourceSearchParams } from '../../_lib/sieve-resources';
import type { Page } from '@/convex/pages';

export type PagesSearchParams = ResourceSearchParams & {
  state?: 'published' | 'unpublished';
};

export function sievePages(pages: Page[], searchParams: PagesSearchParams) {
  return sieveResources(pages, searchParams, {
    matchesState: (page, state) =>
      state === 'published' ? page.isPublished : !page.isPublished,
    searchFields: (page) => [page.name],
    comparators: {
      name: (a, b) => a.name.localeCompare(b.name),
      status: (a, b) => Number(a.isPublished) - Number(b.isPublished),
    },
  });
}
