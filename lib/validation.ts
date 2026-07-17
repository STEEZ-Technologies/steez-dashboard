import { z } from "zod";

const slugField = z
  .string()
  .trim()
  .min(1, { error: "Slug is required" })
  .regex(/^[a-z0-9-]+$/, {
    error: "Slug must be lowercase letters, numbers, and hyphens only",
  });

const optionalText = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v));

export const categoryInputSchema = z.object({
  slug: slugField,
  label: z.string().trim().min(1, { error: "Label is required" }),
  description: optionalText,
});

export const productInputSchema = z.object({
  slug: slugField,
  model: z.string().trim().min(1, { error: "Model is required" }),
  name: z.string().trim().min(1, { error: "Name is required" }),
  description: optionalText,
  imagePath: optionalText,
});

export const finishInputSchema = z.object({
  key: slugField,
  materialLabel: z.string().trim().min(1, { error: "Material label is required" }),
  accentHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, { error: "Must be a hex color like #474950" }),
});

export const userInviteSchema = z.object({
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Password must be at least 8 characters" }),
  role: z.enum(["OWNER", "STAFF"]),
});

export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { error: "Current password is required" }),
  newPassword: z.string().min(8, { error: "New password must be at least 8 characters" }),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type FinishInput = z.infer<typeof finishInputSchema>;
