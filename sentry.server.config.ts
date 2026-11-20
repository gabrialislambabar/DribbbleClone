import * as Sentry from "@sentry/nextjs";

import { scrubBreadcrumb, scrubEvent } from "./lib/observability/scrub";

const dsn = process.env.SENTRY_DSN;
const isProduction = process.env.NODE_ENV === "production";

Sentry.init({
  dsn,
  enabled: Boolean(dsn),
  environment: process.env.NODE_ENV,
  tracesSampleRate: isProduction ? 0.1 : 1.0,
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
