'use client';

import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { PENDING_WORKSPACE_KEY } from '@/lib/pending-workspace';
import { useConvexAuth, useMutation } from 'convex/react';

/**
 * Creates the workspace requested during sign-up. The signup form stores the
 * name in sessionStorage because the auth redirect unmounts it before a
 * mutation issued there is guaranteed to reach the server.
 */
export function PendingWorkspaceCreator() {
  const { isAuthenticated } = useConvexAuth();
  const createWorkspace = useMutation(api.workspaces.create);

  useEffect(() => {
    if (!isAuthenticated) {
      return;
    }
    const name = sessionStorage.getItem(PENDING_WORKSPACE_KEY);
    if (!name) {
      return;
    }
    // Remove before creating so a double-fired effect can't create duplicates.
    sessionStorage.removeItem(PENDING_WORKSPACE_KEY);
    createWorkspace({ name }).catch(() => {
      // Restore so a reload can retry.
      sessionStorage.setItem(PENDING_WORKSPACE_KEY, name);
    });
  }, [isAuthenticated, createWorkspace]);

  return null;
}
