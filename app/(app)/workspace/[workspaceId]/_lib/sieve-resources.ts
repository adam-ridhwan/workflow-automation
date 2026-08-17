import type { Folder } from '@/convex/folders';

export type ResourceSearchParams = {
  state?: string;
  sort?: string;
  order?: 'asc' | 'desc';
  q?: string;
};

type SieveConfig<T> = {
  /** Whether an item matches the active `state` filter. */
  matchesState: (item: T, state: string) => boolean;
  /** The text fields searched by the `q` query. */
  searchFields: (item: T) => Array<string | undefined>;
  /** Sort comparators keyed by the `sort` param; a missing key falls back to
   * most-recent-first. */
  comparators: Record<string, (a: T, b: T) => number>;
};

/** Filters and sorts a workflows/files list from the URL search params. Shared
 * by both sections; each supplies how its items match a state, which fields are
 * searched, and its sort comparators. */
export function sieveResources<T extends { _creationTime: number }>(
  items: T[],
  { state, sort, order, q }: ResourceSearchParams,
  config: SieveConfig<T>
): T[] {
  let result = items;

  if (state) {
    result = result.filter((item) => config.matchesState(item, state));
  }

  if (q) {
    const needle = q.toLowerCase();
    result = result.filter((item) =>
      config
        .searchFields(item)
        .some((field) => field?.toLowerCase().includes(needle) ?? false)
    );
  }

  const comparator = sort ? config.comparators[sort] : undefined;
  // Sort ascending, then flip when the effective order is descending.
  result = [...result].sort(
    comparator ?? ((a, b) => a._creationTime - b._creationTime)
  );

  // Descending unless explicitly ascending.
  if (order !== 'asc') {
    result.reverse();
  }

  return result;
}

/** Folders have no state and are always searched by name and sorted A–Z. When
 * a state filter is active they're hidden entirely (folders have no state). */
export function sieveFolders(
  folders: Folder[],
  { state, q }: Pick<ResourceSearchParams, 'state' | 'q'>
): Folder[] {
  if (state) {
    return [];
  }
  const needle = q?.toLowerCase();
  return folders
    .filter((folder) => !needle || folder.name.toLowerCase().includes(needle))
    .sort((a, b) => a.name.localeCompare(b.name));
}
