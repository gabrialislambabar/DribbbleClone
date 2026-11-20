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
