import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "./lib/observability/scrub";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN,
  enabled: Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN ?? process.env.SENTRY_DSN),
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0,
  dataCollection: {
    userInfo: false,
    cookies: false,
    httpHeaders: {
      request: { deny: ["authorization", "cookie", "x-api-key"] },
      response: false,
    },
    httpBodies: [],
    urlQueryParams: { deny: ["token", "code", "password"] },
  },
  beforeSend: (event) => scrubEvent(event),
  beforeBreadcrumb: (breadcrumb) => scrubBreadcrumb(breadcrumb),
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
