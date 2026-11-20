import { z } from "zod";

export const usernameSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Username must be at least 3 characters.")
  .max(30, "Username must be 30 characters or fewer.")
  .regex(/^[a-z0-9_]+$/, "Use only lowercase letters, numbers, and underscores.");

export const displayNameSchema = z
  .string()
  .trim()
  .min(1, "Display name is required.")
  .max(60, "Display name must be 60 characters or fewer.");

export const profileSchema = z.object({
  display_name: displayNameSchema,
  bio: z
    .string()
    .trim()
    .max(300, "Bio must be 300 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
  portfolio_url: z
    .string()
    .trim()
    .max(500, "Portfolio URL must be 500 characters or fewer.")
    .refine(
      (value) => value === "" || /^https?:\/\/\S+$/i.test(value),
      "Portfolio URL must start with http:// or https://.",
    )
    .transform((value) => (value === "" ? null : value)),
});

export const signUpSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters.")
    .max(72, "Password must be 72 characters or fewer."),
  username: usernameSchema,
  display_name: displayNameSchema,
});

export const signInSchema = z.object({
  email: z.email("Enter a valid email address."),
  password: z.string().min(1, "Password is required."),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProfileInput = z.infer<typeof profileSchema>;

export function firstZodError(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Please check the form and try again.";
}

export function safeRedirectPath(value: string | null | undefined): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}
