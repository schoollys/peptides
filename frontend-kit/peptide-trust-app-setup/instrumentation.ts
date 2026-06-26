import type { Instrumentation } from 'next'

/**
 * Next.js instrumentation. `onRequestError` is the framework hook for capturing
 * server/SSR/route-handler errors centrally. It forwards to Sentry when
 * SENTRY_DSN is set (see lib/observability.ts) and no-ops otherwise.
 */
export function register() {
  // Reserved for future init (tracing, metrics). Intentionally empty.
}

export const onRequestError: Instrumentation.onRequestError = async (err, request, context) => {
  const { captureException } = await import('./lib/observability')
  await captureException(err, {
    route: request.path,
    method: request.method,
    tags: { routerKind: context.routerKind, routeType: context.routeType },
  })
}
