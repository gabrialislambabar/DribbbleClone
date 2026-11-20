import { z } from "zod";

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export const uuidSchema = z.string().regex(UUID_PATTERN, "Invalid identifier.");

export const commentBodySchema = z
  .string()
  .trim()
  .min(1, "Comment cannot be empty.")
  .max(1000, "Comment must be 1,000 characters or fewer.");
