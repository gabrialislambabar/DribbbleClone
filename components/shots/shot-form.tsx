
"use client";

import Image from "next/image";
import Link from "next/link";
import { useActionState, useEffect, useState } from "react";

import type { ShotFormState } from "@/app/shots/actions";
import { Button, buttonClasses } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Field } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import type { Category } from "@/lib/types/app";

import UnsplashSearch from "@/components/UnsplashSearch";

type ShotFormAction = (
  state: ShotFormState,
  formData: FormData,
) => Promise<ShotFormState>;

type ShotFormProps = {
  action: ShotFormAction;
  categories: Category[];
  submitLabel: string;
  defaultValues?: {
    title?: string;
    description?: string | null;
    category_id?: string;
    tags?: string[];
  };
  existingCoverUrl?: string | null;
  coverRequired?: boolean;
  cancelHref?: string;
};

type SelectedPhoto = {
  id: string;
  urls: {
    small: string;
    regular: string;
  };
  alt_description: string | null;
  user: {
    name: string;
    links: {
      html: string;
    };
  };
  links: {
    download_location: string;
  };
};

export function ShotForm({
  action,
  categories,
  submitLabel,
  defaultValues,
  existingCoverUrl,
  coverRequired = false,
  cancelHref = "/dashboard",
}: ShotFormProps) {
  const [state, formAction, pending] = useActionState(
    action,
    {} satisfies ShotFormState
  );

  const [preview, setPreview] = useState<string | null>(null);
  const [unsplashUrl, setUnsplashUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  function handleUnsplashSelect(photo: SelectedPhoto) {
    setUnsplashUrl(photo.urls.regular);
    setPreview(null);

    const fileInput = document.getElementById(
      "cover"
    ) as HTMLInputElement | null;

    if (fileInput) {
      fileInput.value = "";
    }
  }

  function handleFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    setUnsplashUrl(null);
    setPreview(file ? URL.createObjectURL(file) : null);
  }

  const coverPreview = preview ?? unsplashUrl ?? existingCoverUrl;

  return (
    <form action={formAction} className="space-y-6">
      <Card className="space-y-5 p-6">
        <Field label="Title" htmlFor="title" hint="Up to 100 characters.">
          <Input
            id="title"
            name="title"
            defaultValue={defaultValues?.title ?? ""}
            maxLength={100}
            required
            placeholder="A short, descriptive title"
          />
        </Field>

        <Field
          label="Description"
          htmlFor="description"
          hint="Optional. Up to 2,000 characters."
        >
          <Textarea
            id="description"
            name="description"
            defaultValue={defaultValues?.description ?? ""}
            maxLength={2000}
            rows={5}
            placeholder="What is this shot about? Tools, process, context…"
          />
        </Field>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Category" htmlFor="category_id">
            <Select
              id="category_id"
              name="category_id"
              defaultValue={defaultValues?.category_id ?? ""}
              required
            >
              <option value="" disabled>
                Choose a category
              </option>

              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </Field>

          <TagInput name="tags" defaultValue={defaultValues?.tags ?? []} />
        </div>
      </Card>

      <Card className="space-y-4 p-6">
        <div>
          <h2 className="text-sm font-medium">Cover image</h2>
          <p className="mt-1 text-xs text-muted">
            Upload JPEG, PNG, or WebP up to 5 MB, or choose an image from Unsplash.
          </p>
        </div>

        <div className="relative aspect-[16/10] overflow-hidden rounded-xl border border-dashed border-border bg-surface">
          {coverPreview ? (
            coverPreview.startsWith("blob:") ||
            coverPreview.startsWith("https://") ? (
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
                unoptimized
              />
            ) : (
              <Image
                src={coverPreview}
                alt="Cover preview"
                fill
                sizes="(max-width: 768px) 100vw, 640px"
                className="object-cover"
              />
            )
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted">
              No image selected
            </div>
          )}
        </div>

        <input
          type="hidden"
          name="unsplash_url"
          value={unsplashUrl ?? ""}
        />

        <div className="space-y-2">
          <p className="text-sm font-medium">Upload from your device</p>

          <input
            id="cover"
            name="cover"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            required={coverRequired && !unsplashUrl && !existingCoverUrl}
            onChange={handleFileChange}
            className="block w-full text-sm text-muted file:mr-3 file:rounded-full file:border-0 file:bg-surface file:px-3 file:py-2 file:text-sm file:font-medium file:text-foreground hover:file:bg-brand/10"
          />
        </div>

        <div className="border-t border-border pt-4">
          <p className="mb-3 text-sm font-medium">
            Or choose from Unsplash
          </p>

          <UnsplashSearch
            onSelect={handleUnsplashSelect}
            selectedUrl={unsplashUrl}
          />
        </div>

        {!coverRequired && (
          <p className="text-xs text-muted">
            Leave empty to keep the current cover.
          </p>
        )}
      </Card>

      {state.error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {state.error}
        </p>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : submitLabel}
        </Button>

        <Link href={cancelHref} className={buttonClasses("ghost")}>
          Cancel
        </Link>
      </div>
    </form>
  );
}
