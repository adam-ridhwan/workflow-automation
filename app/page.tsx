'use client';

import { useEffect } from 'react';
import { api } from '@/convex/_generated/api';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

// Routes the signed-in user to their first workspace, or to workspace
// creation if they don't have one yet.
export default function Home() {
  const workspaces = useQuery(api.workspaces.list);
  const router = useRouter();

  useEffect(() => {
    if (workspaces === undefined) {
      return;
    }
    const first = workspaces[0];
    if (first) {
      router.replace(`/workspace/${first._id}`);
    } else {
      router.replace('/create-workspace');
    }
  }, [workspaces, router]);

  return null;
}
