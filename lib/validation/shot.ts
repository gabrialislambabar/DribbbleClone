import { z } from "zod";

export const MAX_TAGS_PER_SHOT = 5;
export const MAX_TAG_LENGTH = 30;

export const shotFieldsSchema = z.object({
  title: z
    .string()
    .trim()
    .min(1, "Title is required.")
    .max(100, "Title must be 100 characters or fewer."),
  description: z
    .string()
    .trim()
    .max(2000, "Description must be 2,000 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
  category_id: z.string().trim().min(1, "Choose a category."),
  tags: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Tags cannot be empty.")
        .max(MAX_TAG_LENGTH, `Tags must be ${MAX_TAG_LENGTH} characters or fewer.`),
    )
    .max(MAX_TAGS_PER_SHOT, `Use up to ${MAX_TAGS_PER_SHOT} tags.`),
});

export type ShotFields = z.infer<typeof shotFieldsSchema>;

const UNSPLASH_CREDIT_URL = /^https:\/\/unsplash\.com\/@[A-Za-z0-9_-]+$/;
const UNSPLASH_PHOTO_URL = /^https:\/\/unsplash\.com\/photos\/[A-Za-z0-9_-]+$/;
const UNSPLASH_SOURCE_ID = /^[A-Za-z0-9_-]{5,30}$/;

const unsplashSelectionSchema = z.object({
  cover_path: z
    .string()
    .url()
    .refine(
      (value) => value.startsWith("https://images.unsplash.com/"),
      "Choose a valid Unsplash image.",
    ),
  credit_name: z.string().trim().min(1).max(100),
  credit_url: z.string().regex(UNSPLASH_CREDIT_URL, "Invalid Unsplash credit URL."),
  photo_url: z.string().regex(UNSPLASH_PHOTO_URL, "Invalid Unsplash photo URL."),
  source_id: z.string().regex(UNSPLASH_SOURCE_ID, "Invalid Unsplash photo id."),
  download_location: z.string().url().optional().nullable(),
});

export type UnsplashSelection = z.infer<typeof unsplashSelectionSchema>;

export function parseUnsplashSelection(formData: FormData): {
  selection: UnsplashSelection | null;
  error: string | null;
} {
  const raw = formData.get("unsplash_url");

  if (typeof raw !== "string" || raw.trim() === "") {
    return { selection: null, error: null };
  }

  const downloadLocation =
    typeof formData.get("unsplash_download_location") === "string"
      ? String(formData.get("unsplash_download_location")).trim()
      : "";

  const parsed = unsplashSelectionSchema.safeParse({
    cover_path: raw.trim(),
    credit_name: String(formData.get("unsplash_credit_name") ?? "").trim(),
    credit_url: String(formData.get("unsplash_credit_url") ?? "").trim(),
    photo_url: String(formData.get("unsplash_photo_url") ?? "").trim(),
    source_id: String(formData.get("unsplash_source_id") ?? "").trim(),
    download_location: downloadLocation || null,
  });

  if (!parsed.success) {
    return { selection: null, error: "Choose a valid Unsplash image." };
  }

  if (
    typeof formData.get("unsplash_provider") === "string" &&
    formData.get("unsplash_provider") !== "unsplash"
  ) {
    return { selection: null, error: "Choose a valid Unsplash image." };
  }

  return { selection: parsed.data, error: null };
}

export function parseTagsInput(raw: FormDataEntryValue | null): string[] {
  if (typeof raw !== "string") {
    return [];
  }

  const seen = new Set<string>();
  const tags: string[] = [];

  for (const part of raw.split(",")) {
    const name = part.trim();
    if (!name) {
      continue;
    }

    const key = name.toLowerCase();
    if (seen.has(key)) {
      continue;
    }

    seen.add(key);
    tags.push(name);
  }

  return tags;
}
