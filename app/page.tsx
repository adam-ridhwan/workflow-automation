'use client';

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { api } from '@/convex/_generated/api';
import { useAuthActions } from '@convex-dev/auth/react';
import { useQuery } from 'convex/react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const user = useQuery(api.users.currentUser);
  const { signOut } = useAuthActions();
  const router = useRouter();

  return (
    <main className='flex flex-1 items-center justify-center p-6'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>AI Workflow Builder</CardTitle>
          <CardDescription>
            {user === undefined
              ? 'Loading…'
              : user === null
                ? 'Not signed in.'
                : `Signed in as ${user.name ?? user.email ?? user._id}${
                    user.name && user.email ? ` (${user.email})` : ''
                  }`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant='outline'
            onClick={() => {
              void signOut().then(() => router.push('/signin'));
            }}
          >
            Sign out
          </Button>
        </CardContent>
      </Card>
    </main>
  );
}
