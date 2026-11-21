"use client";

import {
  createContext,
  useContext,
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

import { CloseIcon } from "@/components/ui/icons";
import { MANAGED_PROJECT_OPTIONS } from "@/lib/managed/content";
import { cn } from "@/lib/utils";

type BookingPrefill = { email?: string };
type BookingRequest = { prefill?: BookingPrefill; focusField?: "email" | "name" };

type BookingContextValue = {
  openBooking: (request?: BookingRequest) => void;
};

const BookingContext = createContext<BookingContextValue | null>(null);

function useBooking() {
  const value = useContext(BookingContext);

  if (!value) {
    throw new Error("Booking controls must render inside BookingProvider.");
  }

  return value;
}

export function BookingProvider({ children }: { children: ReactNode }) {
  const [request, setRequest] = useState<BookingRequest | null>(null);

  return (
    <BookingContext.Provider value={{ openBooking: (next) => setRequest(next ?? {}) }}>
      {children}
      {request
        ? createPortal(
            <BookingDialog
              key={`${request.prefill?.email ?? ""}-${request.focusField ?? ""}`}
              request={request}
              onClose={() => setRequest(null)}
            />,
            document.body,
          )
        : null}
    </BookingContext.Provider>
  );
}

type FieldErrors = Partial<Record<"name" | "email" | "project", string>>;

function validate(values: { name: string; email: string; project: string }): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Enter your name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(values.email.trim())) {
    errors.email = "Enter a valid work email address.";
  }

  if (!values.project) {
    errors.project = "Choose what you are planning.";
  }

  return errors;
}

function BookingDialog({
  request,
  onClose,
}: {
  request: BookingRequest;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [values, setValues] = useState({
    name: "",
    email: request.prefill?.email ?? "",
    company: "",
    project: "",
    details: "",
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const previousActive = document.activeElement as HTMLElement | null;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";

    function onKeyDown(event: globalThis.KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
        return;
      }

      if (event.key !== "Tab") {
        return;
      }

      const focusable = dialogRef.current?.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex="-1"])',
      );

      if (!focusable || focusable.length === 0) {
        return;
      }

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }

    document.addEventListener("keydown", onKeyDown);
    window.requestAnimationFrame(() => {
      const selector =
        request.focusField === "email"
          ? 'input[name="email"]'
          : request.focusField === "name"
            ? 'input[name="name"]'
            : 'input[name="name"], input[name="email"]';

      dialogRef.current?.querySelector<HTMLInputElement>(selector)?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previousActive?.focus();
    };
  }, [onClose, request.focusField]);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // Demo only: no booking, email, or CRM submission is performed.
    setSent(true);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div
        className="absolute inset-0 bg-foreground/50"
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={headingId}
        className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-t-3xl bg-white p-6 shadow-2xl sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2
              id={headingId}
              className="text-lg font-semibold tracking-tight text-foreground"
            >
              Book a call
            </h2>
            <p className="mt-1 text-sm leading-6 text-muted">
              Tell us what you are shipping and we will pick a time. This clone has no
              calendar connected, so nothing is scheduled or sent.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close booking form"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <CloseIcon />
          </button>
        </div>

        {sent ? (
          <div
            role="status"
            className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5"
          >
            <p className="text-sm font-semibold text-emerald-900">
              Request captured (demo only).
            </p>
            <p className="mt-1 text-sm leading-6 text-emerald-800">
              A live version would reply within one business day and share times. No email
              was sent and no meeting was booked.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 inline-flex h-10 items-center rounded-full bg-foreground px-4 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={onSubmit} noValidate className="mt-6 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="booking-name" className="text-sm font-medium">
                  Your name
                </label>
                <input
                  id="booking-name"
                  name="name"
                  value={values.name}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      name: event.target.value,
                    }))
                  }
                  autoComplete="name"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? "booking-name-error" : undefined}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
                {errors.name ? (
                  <p id="booking-name-error" className="mt-1 text-xs text-red-600">
                    {errors.name}
                  </p>
                ) : null}
              </div>

              <div>
                <label htmlFor="booking-company" className="text-sm font-medium">
                  Company <span className="text-muted">(optional)</span>
                </label>
                <input
                  id="booking-company"
                  name="company"
                  value={values.company}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      company: event.target.value,
                    }))
                  }
                  autoComplete="organization"
                  className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <div>
              <label htmlFor="booking-email" className="text-sm font-medium">
                Work email address
              </label>
              <input
                id="booking-email"
                name="email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    email: event.target.value,
                  }))
                }
                autoComplete="email"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "booking-email-error" : undefined}
                className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {errors.email ? (
                <p id="booking-email-error" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="booking-project" className="text-sm font-medium">
                What are you planning?
              </label>
              <select
                id="booking-project"
                name="project"
                value={values.project}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    project: event.target.value,
                  }))
                }
                aria-invalid={Boolean(errors.project)}
                aria-describedby={errors.project ? "booking-project-error" : undefined}
                className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              >
                <option value="">Select an option</option>
                {MANAGED_PROJECT_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              {errors.project ? (
                <p id="booking-project-error" className="mt-1 text-xs text-red-600">
                  {errors.project}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="booking-details" className="text-sm font-medium">
                Anything we should know? <span className="text-muted">(optional)</span>
              </label>
              <textarea
                id="booking-details"
                name="details"
                rows={3}
                value={values.details}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    details: event.target.value,
                  }))
                }
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
            </div>

            <p className="text-xs leading-5 text-muted">
              Demo form. Submitting does not contact any company and does not create a
              meeting.
            </p>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="inline-flex h-10 items-center rounded-full px-4 text-sm font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="inline-flex h-10 items-center rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Request a time
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function BookCallButton({
  children = "Book a call",
  variant = "primary",
  className,
  label,
}: {
  children?: ReactNode;
  variant?: "primary" | "light" | "outline";
  className?: string;
  label?: string;
}) {
  const { openBooking } = useBooking();

  return (
    <button
      type="button"
      onClick={() => openBooking()}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
        variant === "primary" && "bg-foreground text-white hover:bg-foreground/90",
        variant === "light" && "bg-white text-foreground hover:bg-white/90",
        variant === "outline" &&
          "border border-foreground/15 bg-white/70 text-foreground hover:bg-white",
        className,
      )}
      aria-label={label}
    >
      {children}
    </button>
  );
}

export function RequestCallForm() {
  const { openBooking } = useBooking();
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();

        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) {
          setError("Enter a valid work email address.");
          return;
        }

        setError(null);
        openBooking({ prefill: { email: email.trim() }, focusField: "name" });
      }}
      className="w-full max-w-md"
    >
      <label htmlFor="managed-work-email" className="sr-only">
        Work email
      </label>
      <div className="flex flex-col gap-2 sm:flex-row">
        <input
          id="managed-work-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setError(null);
          }}
          placeholder="Enter your work email"
          autoComplete="email"
          aria-invalid={Boolean(error)}
          aria-describedby={error ? "managed-work-email-error" : undefined}
          className="h-11 w-full min-w-0 rounded-full border border-foreground/15 bg-white px-4 text-sm text-foreground outline-none placeholder:text-muted/70 focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        <button
          type="submit"
          className="inline-flex h-11 shrink-0 items-center justify-center rounded-full bg-brand px-5 text-sm font-medium text-white transition-colors hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Book a call
        </button>
      </div>
      {error ? (
        <p id="managed-work-email-error" className="mt-2 text-xs text-red-600">
          {error}
        </p>
      ) : null}
    </form>
  );
}
