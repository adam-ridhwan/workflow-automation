'use client';

import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';

import { useWorkspaceParams } from './use-workspace-params';

export type WorkspaceRole = 'editor' | 'viewer';

/** The signed-in user's role in the current workspace, or `undefined` while
 * loading. Derived by matching the current user against the member list (there
 * is no dedicated "my role" query). */
export function useWorkspaceRole(): WorkspaceRole | undefined {
  const { workspaceId } = useWorkspaceParams();
  const members = useQuery(api.workspaces.members, { workspaceId });
  const me = useQuery(api.users.currentUser, {});
  if (members === undefined || me === undefined) {
    return undefined;
  }
  return members.find((member) => member.userId === me?._id)?.role;
}

/** Whether the current user can make changes (editors and the owner).
 * Viewers are read-only. Defaults to `true` while the role is still loading so
 * editors never see their controls flash away; the backend enforces the real
 * rule regardless. */
export function useCanWrite(): boolean {
  const role = useWorkspaceRole();
  return role !== 'viewer';
}
