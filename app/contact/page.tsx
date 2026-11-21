import type { Metadata } from "next";

import { ContactForm } from "@/components/contact/contact-form";

export const metadata: Metadata = {
  title: "Start a project brief",
  description: "Tell us what you need and get matched with designers.",
};

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-12">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Start a project brief
        </h1>
        <p className="mt-2 text-sm leading-6 text-muted">
          Share a short summary of the work. This clone runs entirely on demo data, so
          submitting the form does not send a message anywhere.
        </p>
      </header>

      <div className="mt-8">
        <ContactForm />
      </div>
    </div>
  );
}
