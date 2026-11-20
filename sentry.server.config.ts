import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "./lib/observability/scrub";

const dsn = process.env.SENTRY_DSN;

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
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
