import { defineConfig, globalIgnores } from 'eslint/config'
import nextVitals from 'eslint-config-next/core-web-vitals'
import nextTs from 'eslint-config-next/typescript'

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      // `purity` is enforced (currently 0 violations) — render functions and
      // their dependencies must stay pure.
      'react-hooks/purity': 'error',
      // `set-state-in-effect` stays a warning. Every current hit is a legitimate
      // effect synchronizing with an external system — IntersectionObserver
      // animations (count-up, reveal), post-hydration browser-API reads
      // (badge-code-block), async data-fetch effects (catalog/compare/profile/
      // dashboard/out/badge) and an auth redirect (require-auth). Eliminating
      // them is a data-layer/SSR refactor (move fetching to Server Components /
      // route loaders), not a mechanical lint fix — tracked separately.
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
  globalIgnores([
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
  ]),
])

export default eslintConfig
