type ScrubTarget = {
  request?: {
    cookies?: unknown;
    headers?: Record<string, string | undefined>;
  };
  user?: {
    email?: string | null;
    ip_address?: string | null;
  };
  extra?: Record<string, unknown>;
};

type ScrubBreadcrumb = {
  message?: string;
  data?: Record<string, unknown>;
};

const SENSITIVE_KEY =
  /password|passwd|token|secret|authorization|cookie|apikey|api_key|api-key|access_token|refresh_token|session/i;

const SENSITIVE_HEADER = /authorization|cookie|api-?key|x-api-key/i;

export function redactRecord(
  input: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!input) {
    return undefined;
  }

  const output: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (SENSITIVE_KEY.test(key)) {
      output[key] = "[redacted]";
      continue;
    }

    output[key] = redactValue(value);
  }

  return output;
}

function redactValue(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactValue(item));
  }

  if (value && typeof value === "object") {
    return redactRecord(value as Record<string, unknown>);
  }

  return value;
}

export function scrubEvent<T extends ScrubTarget>(event: T): T {
  if (event.request) {
    delete event.request.cookies;

    if (event.request.headers) {
      for (const key of Object.keys(event.request.headers)) {
        if (SENSITIVE_HEADER.test(key)) {
          event.request.headers[key] = "[redacted]";
        }
      }
    }
  }

  if (event.user) {
    delete event.user.email;
    delete event.user.ip_address;
  }

  if (event.extra) {
    event.extra = redactRecord(event.extra);
  }

  return event;
}

export function scrubBreadcrumb<T extends ScrubBreadcrumb>(breadcrumb: T): T | null {
  const message = breadcrumb.message ?? "";

  if (/\/auth\/|token=|password=/i.test(message)) {
    return null;
  }

  if (breadcrumb.data) {
    breadcrumb.data = redactRecord(breadcrumb.data);
  }

  return breadcrumb;
}
