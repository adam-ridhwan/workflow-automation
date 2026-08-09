'use client';

import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { useMutation } from 'convex/react';

import { useWorkspaceParams } from '../../../_hooks/use-workspace-params';

/** Every 5 minutes while the editor is open, snapshot a canvas version. The
 * backend skips the snapshot when nothing changed, so idle time is free. */
const AUTO_VERSION_INTERVAL_MS = 5 * 60 * 1000;

export function useAutoVersion() {
  const { workspaceName, workflowId } = useWorkspaceParams();
  const saveVersion = useMutation(api.workflows.saveVersion);

  useEffect(() => {
    const id = setInterval(() => {
      saveVersion({ workspaceName, workflowId }).catch(() => {
        // Background auto-save; ignore transient failures.
      });
    }, AUTO_VERSION_INTERVAL_MS);
    return () => clearInterval(id);
  }, [saveVersion, workspaceName, workflowId]);
}
