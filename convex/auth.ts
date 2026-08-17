import Google from '@auth/core/providers/google';
import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';

import {
  PASSWORD_REQUIREMENTS,
  validatePassword,
} from '../lib/validate-password';

import type { DataModel } from './_generated/dataModel';
import type { GenericDatabaseWriter } from 'convex/server';

export const { auth, signIn, signOut, store, isAuthenticated } = convexAuth({
  providers: [
    // Reads AUTH_GOOGLE_ID / AUTH_GOOGLE_SECRET from the Convex environment.
    Google,
    Password<DataModel>({
      profile(params) {
        const name = typeof params.name === 'string' ? params.name.trim() : '';
        if (params.flow === 'signUp' && !name) {
          throw new ConvexError('Name is required.');
        }
        return {
          email: params.email as string,
          name,
        };
      },
      validatePasswordRequirements(password: string) {
        if (!validatePassword(password)) {
          throw new ConvexError(PASSWORD_REQUIREMENTS);
        }
      },
    }),
  ],
  callbacks: {
    /**
     * Enforce one account per email across every sign-in method.
     *
     * The library's default only links/dedupes by *verified* email, so an
     * email registered with a password (which has no `emailVerificationTime`)
     * would not match a later Google sign-in — creating a second user with the
     * same email. We instead reject any sign-in that would attach a *new*
     * account to an email that already belongs to a user.
     */
    async createOrUpdateUser(ctx, args) {
      // Signing in to an account that already exists for this provider — allow.
      if (args.existingUserId !== null) {
        return args.existingUserId;
      }

      const db = ctx.db as unknown as GenericDatabaseWriter<DataModel>;

      const email =
        typeof args.profile.email === 'string'
          ? args.profile.email.trim()
          : undefined;

      if (email) {
        const existing = await db
          .query('users')
          .withIndex('email', (q) => q.eq('email', email))
          .first();
        if (existing !== null) {
          throw new ConvexError(
            'An account with this email already exists. Sign in with the method you used originally.'
          );
        }
      }

      const emailVerified =
        args.profile.emailVerified ??
        (args.provider.type === 'oauth' || args.provider.type === 'oidc');

      const name =
        typeof args.profile.name === 'string' && args.profile.name.trim()
          ? args.profile.name.trim()
          : (email?.split('@')[0] ?? 'User');

      return await db.insert('users', {
        email: email ?? '',
        name,
        ...(typeof args.profile.image === 'string'
          ? { image: args.profile.image }
          : {}),
        ...(emailVerified ? { emailVerificationTime: Date.now() } : {}),
      });
    },
  },
});
