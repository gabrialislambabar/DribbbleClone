import type { Metadata } from "next";

import { ShotForm } from "@/components/shots/shot-form";
import { createShot } from "@/app/shots/actions";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";

export const metadata: Metadata = {
  title: "New shot",
};

export default async function NewShotPage() {
  await requireUser();
  const categories = await getCategories();

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">New shot</h1>

        <p className="mt-1 text-sm text-muted">
          Your shot is saved as a private draft. Publish it when you are ready.
        </p>
      </div>

      <ShotForm
        action={createShot}
        categories={categories}
        submitLabel="Save draft"
        coverRequired
      />
    </div>
  );
}
