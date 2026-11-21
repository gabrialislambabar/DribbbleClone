import { z } from "zod";

import { uuidSchema } from "@/lib/validation/social";

export const REPORT_REASONS = ["spam", "abuse", "copyright", "other"] as const;
export const REPORT_TARGETS = ["shot", "comment", "profile"] as const;
export const RESOLVED_STATUSES = ["reviewed", "dismissed", "actioned"] as const;

export const REPORT_REASON_LABELS: Record<(typeof REPORT_REASONS)[number], string> = {
  spam: "Spam",
  abuse: "Abuse or harassment",
  copyright: "Copyright",
  other: "Other",
};

const optionalTargetId = z
  .union([uuidSchema, z.literal("")])
  .optional()
  .transform((value) => (value ? value : null));

export const reportSchema = z
  .object({
    target_type: z.enum(REPORT_TARGETS),
    shot_id: optionalTargetId,
    comment_id: optionalTargetId,
    profile_id: optionalTargetId,
    reason: z.enum(REPORT_REASONS),
    details: z
      .string()
      .trim()
      .max(1000, "Details must be 1,000 characters or fewer.")
      .transform((value) => (value === "" ? null : value)),
  })
  .superRefine((value, ctx) => {
    const targets = [
      value.target_type === "shot" && value.shot_id,
      value.target_type === "comment" && value.comment_id,
      value.target_type === "profile" && value.profile_id,
    ].filter(Boolean);

    if (targets.length !== 1) {
      ctx.addIssue({
        code: "custom",
        message: "Choose one thing to report.",
        path: ["target_type"],
      });
    }
  });

export const resolveReportSchema = z.object({
  status: z.enum(RESOLVED_STATUSES),
  note: z
    .string()
    .trim()
    .max(500, "Notes must be 500 characters or fewer.")
    .transform((value) => (value === "" ? null : value)),
});

export type ReportInput = z.infer<typeof reportSchema>;
