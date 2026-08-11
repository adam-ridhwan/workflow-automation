'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/cn';
import {
  PASSWORD_REQUIREMENTS,
  validatePassword,
} from '@/lib/validate-password';
import { useAuthActions } from '@convex-dev/auth/react';
import { SiApple, SiGoogle, SiMeta } from '@icons-pack/react-simple-icons';
import { ConvexError } from 'convex/values';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export function SignupForm({
  className,
  ...props
}: React.ComponentProps<'div'>) {
  const { signIn } = useAuthActions();
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPasswordError(null);

    const formData = new FormData(e.currentTarget);
    const password = String(formData.get('password') ?? '');
    const confirmPassword = String(formData.get('confirm-password') ?? '');

    if (!validatePassword(password)) {
      setPasswordError(PASSWORD_REQUIREMENTS);
      return;
    }
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }

    formData.set('flow', 'signUp');
    formData.delete('confirm-password');

    setSubmitting(true);
    try {
      await signIn('password', formData);
      router.push('/create-workspace');
    } catch (err) {
      if (err instanceof ConvexError && typeof err.data === 'string') {
        setError(err.data);
      } else {
        setError(
          'Could not create account. An account with this email may already exist.'
        );
      }
      setSubmitting(false);
    }
  }

  return (
    <div className={cn('flex flex-col gap-6', className)} {...props}>
      <Card className='overflow-hidden p-0'>
        <CardContent className='grid p-0'>
          <form className='p-6 md:p-8' onSubmit={handleSubmit}>
            <FieldGroup>
              <div className='flex flex-col items-center gap-2 text-center'>
                <h1 className='text-2xl font-bold'>Create your account</h1>
                <p className='text-muted-foreground text-sm text-balance'>
                  Enter your email below to create your account
                </p>
              </div>
              <Field>
                <FieldLabel htmlFor='name'>Name</FieldLabel>
                <Input
                  id='name'
                  name='name'
                  type='text'
                  autoComplete='name'
                  placeholder='Your name'
                  required
                />
              </Field>
              <Field>
                <FieldLabel htmlFor='email'>Email</FieldLabel>
                <Input
                  id='email'
                  name='email'
                  type='email'
                  autoComplete='email'
                  placeholder='m@example.com'
                  required
                />
                <FieldDescription>
                  We&apos;ll use this to contact you. We will not share your
                  email with anyone else.
                </FieldDescription>
              </Field>
              <Field>
                <Field className='grid grid-cols-2 gap-4'>
                  <Field>
                    <FieldLabel htmlFor='password'>Password</FieldLabel>
                    <Input
                      id='password'
                      name='password'
                      type='password'
                      autoComplete='new-password'
                      aria-invalid={passwordError ? true : undefined}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor='confirm-password'>
                      Confirm Password
                    </FieldLabel>
                    <Input
                      id='confirm-password'
                      name='confirm-password'
                      type='password'
                      autoComplete='new-password'
                      aria-invalid={passwordError ? true : undefined}
                      required
                    />
                  </Field>
                </Field>
                <FieldDescription
                  className={cn(passwordError && 'text-destructive')}
                >
                  {passwordError ?? PASSWORD_REQUIREMENTS}
                </FieldDescription>
              </Field>
              {error && (
                <p className='text-destructive text-center text-sm'>{error}</p>
              )}
              <Field>
                <Button type='submit' disabled={submitting}>
                  {submitting ? 'Creating account…' : 'Create Account'}
                </Button>
              </Field>
              <FieldSeparator className='*:data-[slot=field-separator-content]:bg-card'>
                Or continue with
              </FieldSeparator>
              <Field className='grid grid-cols-3 gap-4'>
                <Button variant='outline' type='button' disabled>
                  <SiApple className='size-4' />
                  <span className='sr-only'>Sign up with Apple</span>
                </Button>
                <Button variant='outline' type='button' disabled>
                  <SiGoogle className='size-4' />
                  <span className='sr-only'>Sign up with Google</span>
                </Button>
                <Button variant='outline' type='button' disabled>
                  <SiMeta className='size-4' />
                  <span className='sr-only'>Sign up with Meta</span>
                </Button>
              </Field>
              <FieldDescription className='text-center'>
                Already have an account? <Link href='/signin'>Sign in</Link>
              </FieldDescription>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>

      {/*<FieldDescription className='px-6 text-center'>
        By clicking continue, you agree to our <a href='#'>Terms of Service</a>{' '}
        and <a href='#'>Privacy Policy</a>.
      </FieldDescription>*/}
    </div>
  );
}
