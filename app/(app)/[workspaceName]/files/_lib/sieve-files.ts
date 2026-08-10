import { sieveResources } from '../../_lib/sieve-resources';

import type { ResourceSearchParams } from '../../_lib/sieve-resources';
import type { File, FileStatus } from '@/convex/files';

export type FilesSearchParams = ResourceSearchParams & {
  state?: FileStatus;
};

// Sort order used when sorting by status: least-done first.
const STATUS_ORDER: Record<FileStatus, number> = {
  failed: 0,
  uploading: 1,
  assembling: 2,
  processing: 3,
  indexed: 4,
};

export function sieveFiles(files: File[], searchParams: FilesSearchParams) {
  return sieveResources(files, searchParams, {
    matchesState: (file, state) => file.status === state,
    searchFields: (file) => [file.name],
    comparators: {
      name: (a, b) => a.name.localeCompare(b.name),
      status: (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status],
      size: (a, b) => a.size - b.size,
    },
  });
}
