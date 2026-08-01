'use client';

import { useParams } from 'next/navigation';

/** The workspace name from the current URL, decoded. */
export function useWorkspaceName() {
  const params = useParams<{ workspaceName: string }>();
  return decodeURIComponent(params.workspaceName);
}
