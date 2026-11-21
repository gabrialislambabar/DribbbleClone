import { z } from "zod";

const httpsUrl = z
  .string()
  .trim()
  .max(2048)
  .refine((value) => {
    try {
      return new URL(value).protocol === "https:";
    } catch {
      return false;
    }
  }, "URL must use https.");

export const savedDesignSchema = z.object({
  source: z.enum(["pexels", "unsplash", "openverse", "pixabay"]),
  sourceItemId: z.string().trim().min(1).max(128),
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(40),
  imageUrl: httpsUrl,
  thumbnailUrl: httpsUrl,
  sourceUrl: httpsUrl,
  creatorName: z.string().trim().max(160).nullable(),
  creatorUrl: httpsUrl.nullable(),
  licenseName: z.string().trim().max(80).nullable(),
  licenseUrl: httpsUrl.nullable(),
});

export type SavedDesignInput = z.infer<typeof savedDesignSchema>;
