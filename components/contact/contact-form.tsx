"use client";

import { useState } from "react";

import { DESIGNER_CATEGORIES } from "@/lib/designers/types";

const BUDGETS = ["Under $1,000", "$1,000 – $3,000", "$3,000 – $5,000", "$5,000+"];

export function ContactForm() {
  const [sent, setSent] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [values, setValues] = useState({
    name: "",
    email: "",
    category: "",
    budget: "",
    message: "",
  });

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next: Record<string, string> = {};

    if (values.name.trim().length < 2) next.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      next.email = "Enter a valid email address.";
    }
    if (!values.category) next.category = "Choose a category.";
    if (!values.budget) next.budget = "Choose a budget.";
    if (values.message.trim().length < 20) {
      next.message = "Describe the project in at least 20 characters.";
    }

    setErrors(next);

    if (Object.keys(next).length === 0) {
      setSent(true);
    }
  }

  if (sent) {
    return (
      <div
        role="status"
        className="rounded-2xl border border-emerald-200 bg-emerald-50 p-6"
      >
        <h2 className="text-base font-semibold text-emerald-900">
          Brief captured (demo only)
        </h2>
        <p className="mt-2 text-sm text-emerald-800">
          Nothing was sent. In production this form would create a brief and match it with
          designers.
        </p>
        <button
          type="button"
          onClick={() => {
            setSent(false);
            setValues({
              name: "",
              email: "",
              category: "",
              budget: "",
              message: "",
            });
          }}
          className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
        >
          Start another brief
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="space-y-5 rounded-2xl border border-border bg-white p-6"
    >
      <div>
        <label htmlFor="brief-name" className="text-sm font-medium">
          Your name
        </label>
        <input
          id="brief-name"
          value={values.name}
          onChange={(event) =>
            setValues((current) => ({ ...current, name: event.target.value }))
          }
          aria-invalid={Boolean(errors.name)}
          className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {errors.name ? <p className="mt-1 text-xs text-red-600">{errors.name}</p> : null}
      </div>

      <div>
        <label htmlFor="brief-email" className="text-sm font-medium">
          Email
        </label>
        <input
          id="brief-email"
          type="email"
          value={values.email}
          onChange={(event) =>
            setValues((current) => ({ ...current, email: event.target.value }))
          }
          aria-invalid={Boolean(errors.email)}
          className="mt-1.5 h-11 w-full rounded-xl border border-border px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {errors.email ? (
          <p className="mt-1 text-xs text-red-600">{errors.email}</p>
        ) : null}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="brief-category" className="text-sm font-medium">
            Project category
          </label>
          <select
            id="brief-category"
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
          <label htmlFor="brief-budget" className="text-sm font-medium">
            Budget
          </label>
          <select
            id="brief-budget"
            value={values.budget}
            onChange={(event) =>
              setValues((current) => ({ ...current, budget: event.target.value }))
            }
            aria-invalid={Boolean(errors.budget)}
            className="mt-1.5 h-11 w-full rounded-xl border border-border bg-white px-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          >
            <option value="">Select a budget</option>
            {BUDGETS.map((budget) => (
              <option key={budget} value={budget}>
                {budget}
              </option>
            ))}
          </select>
          {errors.budget ? (
            <p className="mt-1 text-xs text-red-600">{errors.budget}</p>
          ) : null}
        </div>
      </div>

      <div>
        <label htmlFor="brief-message" className="text-sm font-medium">
          Project details
        </label>
        <textarea
          id="brief-message"
          rows={5}
          value={values.message}
          onChange={(event) =>
            setValues((current) => ({ ...current, message: event.target.value }))
          }
          aria-invalid={Boolean(errors.message)}
          className="mt-1.5 w-full rounded-xl border border-border px-3 py-2 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
        {errors.message ? (
          <p className="mt-1 text-xs text-red-600">{errors.message}</p>
        ) : null}
      </div>

      <button
        type="submit"
        className="inline-flex h-11 items-center justify-center rounded-full bg-foreground px-5 text-sm font-medium text-white hover:bg-foreground/90 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
      >
        Submit brief
      </button>
    </form>
  );
}
