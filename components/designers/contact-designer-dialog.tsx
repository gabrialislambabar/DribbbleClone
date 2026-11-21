"use client";

import { useEffect, useId, useRef, useState } from "react";

import { CloseIcon } from "@/components/ui/icons";
import { DESIGNER_CATEGORIES, type Designer } from "@/lib/designers/types";

type ContactDesignerDialogProps = {
  designer: Designer | null;
  open: boolean;
  onClose: () => void;
};

type FieldErrors = Partial<
  Record<"name" | "email" | "category" | "budget" | "message", string>
>;

const BUDGET_OPTIONS = ["Under $1,000", "$1,000 – $3,000", "$3,000 – $5,000", "$5,000+"];

function validate(values: {
  name: string;
  email: string;
  category: string;
  budget: string;
  message: string;
}): FieldErrors {
  const errors: FieldErrors = {};

  if (values.name.trim().length < 2) {
    errors.name = "Enter your name.";
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
    errors.email = "Enter a valid email address.";
  }

  if (!values.category) {
    errors.category = "Choose a project category.";
  }

  if (!values.budget) {
    errors.budget = "Choose a budget range.";
  }

  if (values.message.trim().length < 20) {
    errors.message = "Describe the project in at least 20 characters.";
  }

  return errors;
}

function ContactDialogContent({
  designer,
  onClose,
}: {
  designer: Designer;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const headingId = useId();
  const [values, setValues] = useState({
    name: "",
    email: "",
    category: "",
    budget: "",
    message: "",
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
      dialogRef.current?.querySelector<HTMLInputElement>('input[name="name"]')?.focus();
    });

    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = overflow;
      previousActive?.focus();
    };
  }, [onClose]);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    // Demo only: no email or message is sent.
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
            <h2 id={headingId} className="text-lg font-semibold text-foreground">
              Get in touch with {designer.name}
            </h2>
            <p className="mt-1 text-sm text-muted">
              This form is a demo. Nothing is sent and no email is delivered.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close inquiry form"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            <CloseIcon />
          </button>
        </div>

        {sent ? (
          <div className="mt-6 rounded-2xl border border-emerald-200 bg-emerald-50 p-5">
            <p className="text-sm font-medium text-emerald-800">
              Inquiry captured (demo only).
            </p>
            <p className="mt-1 text-sm text-emerald-700">
              In a production build this would create a message thread. Nothing was sent
              from this clone.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-4 h-10 rounded-full bg-foreground px-4 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            <div>
              <label htmlFor="contact-name" className="text-sm font-medium">
                Your name
              </label>
              <input
                id="contact-name"
                name="name"
                value={values.name}
                onChange={(event) =>
                  setValues((current) => ({ ...current, name: event.target.value }))
                }
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "contact-name-error" : undefined}
                className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {errors.name ? (
                <p id="contact-name-error" className="mt-1 text-xs text-red-600">
                  {errors.name}
                </p>
              ) : null}
            </div>

            <div>
              <label htmlFor="contact-email" className="text-sm font-medium">
                Email
              </label>
              <input
                id="contact-email"
                name="email"
                type="email"
                value={values.email}
                onChange={(event) =>
                  setValues((current) => ({ ...current, email: event.target.value }))
                }
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "contact-email-error" : undefined}
                className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {errors.email ? (
                <p id="contact-email-error" className="mt-1 text-xs text-red-600">
                  {errors.email}
                </p>
              ) : null}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="contact-category" className="text-sm font-medium">
                  Project category
                </label>
                <select
                  id="contact-category"
                  name="category"
                  value={values.category}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      category: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.category)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select a category</option>
                  {DESIGNER_CATEGORIES.map((category) => (
                    <option key={category.slug} value={category.label}>
                      {category.label}
                    </option>
                  ))}
                </select>
                {errors.category ? (
                  <p className="mt-1 text-xs text-red-600">{errors.category}</p>
                ) : null}
              </div>

              <div>
                <label htmlFor="contact-budget" className="text-sm font-medium">
                  Budget
                </label>
                <select
                  id="contact-budget"
                  name="budget"
                  value={values.budget}
                  onChange={(event) =>
                    setValues((current) => ({
                      ...current,
                      budget: event.target.value,
                    }))
                  }
                  aria-invalid={Boolean(errors.budget)}
                  className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  <option value="">Select a budget</option>
                  {BUDGET_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
                {errors.budget ? (
                  <p className="mt-1 text-xs text-red-600">{errors.budget}</p>
                ) : null}
              </div>
            </div>

            <div>
              <label htmlFor="contact-message" className="text-sm font-medium">
                Project details
              </label>
              <textarea
                id="contact-message"
                name="message"
                rows={4}
                value={values.message}
                onChange={(event) =>
                  setValues((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                aria-invalid={Boolean(errors.message)}
                aria-describedby={errors.message ? "contact-message-error" : undefined}
                className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
              />
              {errors.message ? (
                <p id="contact-message-error" className="mt-1 text-xs text-red-600">
                  {errors.message}
                </p>
              ) : null}
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
              <button
                type="button"
                onClick={onClose}
                className="h-10 rounded-full px-4 text-sm font-medium text-muted hover:bg-surface hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="h-10 rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
              >
                Send inquiry
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

export function ContactDesignerDialog({
  designer,
  open,
  onClose,
}: ContactDesignerDialogProps) {
  if (!open || !designer) {
    return null;
  }

  return <ContactDialogContent key={designer.id} designer={designer} onClose={onClose} />;
}
