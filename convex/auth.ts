import Google from '@auth/core/providers/google';
import { Password } from '@convex-dev/auth/providers/Password';
import { convexAuth } from '@convex-dev/auth/server';
import { ConvexError } from 'convex/values';

import {
  PASSWORD_REQUIREMENTS,
  validatePassword,
} from '../lib/validate-password';

import type { DataModel } from './_generated/dataModel';

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
});
