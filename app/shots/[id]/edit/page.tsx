import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { updateShot } from "@/app/shots/actions";
import { ShotForm } from "@/components/shots/shot-form";
import { requireUser } from "@/lib/auth";
import { getCategories } from "@/lib/data/categories";
import { getShotById } from "@/lib/data/shots";
import { shotCoverUrl } from "@/lib/storage";

export const metadata: Metadata = {
  title: "Edit shot",
};

type EditShotPageProps = {
  params: Promise<{ id: string }>;
};

export default async function EditShotPage({ params }: EditShotPageProps) {
  const { id } = await params;
  const user = await requireUser();
  const shot = await getShotById(id);

  if (!shot || shot.creator.id !== user.id) {
    notFound();
  }

  const categories = await getCategories();
  const action = updateShot.bind(null, shot.id);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="mb-6">
        <h1 className="text-3xl font-semibold tracking-tight">Edit shot</h1>
        <p className="mt-1 text-sm text-muted">
          Changes to a published shot appear immediately without moving it in the feed.
        </p>
      </div>

      <ShotForm
        action={action}
        categories={categories}
        submitLabel="Save changes"
        defaultValues={{
          title: shot.title,
          description: shot.description,
          category_id: shot.category_id,
          tags: shot.tags.map((tag) => tag.name),
        }}
        existingCoverUrl={shotCoverUrl(shot.cover_image_path)}
        cancelHref={`/shots/${shot.id}`}
      />
    </div>
  );
}
