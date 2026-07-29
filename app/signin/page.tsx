'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuthActions } from '@convex-dev/auth/react';
import { ConvexError } from 'convex/values';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    formData.set('flow', 'signIn');

    try {
      await signIn('password', formData);
      router.push('/');
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError('Invalid email or password.');
      }
      setSubmitting(false);
    }
  }

  return (
    <main className='flex flex-1 items-center justify-center p-6'>
      <Card className='w-full max-w-sm'>
        <CardHeader>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your account.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className='flex flex-col gap-4'>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='email'>Email</Label>
              <Input
                id='email'
                name='email'
                type='email'
                autoComplete='email'
                placeholder='you@example.com'
                required
              />
            </div>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='password'>Password</Label>
              <Input
                id='password'
                name='password'
                type='password'
                autoComplete='current-password'
                required
              />
            </div>
            {error && <p className='text-destructive text-sm'>{error}</p>}
          </CardContent>
          <CardFooter className='mt-6 flex flex-col gap-3'>
            <Button type='submit' className='w-full' disabled={submitting}>
              {submitting ? 'Please wait…' : 'Sign in'}
            </Button>
            <p className='text-muted-foreground text-sm'>
              Don&apos;t have an account?{' '}
              <Link
                href='/signup'
                className='hover:text-foreground underline underline-offset-4'
              >
                Sign up
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </main>
  );
}
