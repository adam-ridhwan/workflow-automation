import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';
import { defineConfig, globalIgnores } from 'eslint/config';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // Allow omitting a property via rest destructuring (`const { secret,
      // ...rest } = obj`) and intentionally-unused `_`-prefixed bindings.
      '@typescript-eslint/no-unused-vars': [
        'warn',
        {
          ignoreRestSiblings: true,
          argsIgnorePattern: '^_',
          varsIgnorePattern: '^_',
        },
      ],
      // Nested ternaries are hard to read — use if/else or a lookup instead.
      'no-nested-ternary': 'error',
      // Name event-handler params `e`, never `event` (avoids shadowing the
      // deprecated global `event` and keeps handlers terse).
      'id-denylist': ['error', 'event'],
    },
  },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    'convex/_generated/**',
  ]),
]);

export default eslintConfig;
