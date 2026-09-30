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
  nameZh: optionalText,
  description: optionalText,
  descriptionZh: optionalText,
  imagePath: optionalText,
});

export const productContentInputSchema = z.object({
  textEn: z.string().trim().min(1, { error: "English text is required" }),
  textZh: optionalText,
});

// litresPerDay/minBar/sources arrive as text from the form and are parsed by
// the caller — every field here is optional on purpose (null means "the
// catalogue doesn't say," never a guessed value).
export const productFitInputSchema = z.object({
  litresPerDayText: optionalText,
  minBarText: optionalText,
  sources: z.array(z.enum(["MAINS", "OPEN"])).default([]),
  dispensing: z.enum(["TANK", "JAR", "DIRECT"]),
  powered: z.boolean().default(false),
});

export const finishInputSchema = z.object({
  key: slugField,
  materialLabel: z.string().trim().min(1, { error: "Material label is required" }),
  accentHex: z
    .string()
    .trim()
    .regex(/^#[0-9a-fA-F]{6}$/, { error: "Must be a hex color like #474950" }),
});

export const articleInputSchema = z.object({
  slug: slugField,
  titleEn: z.string().trim().min(1, { error: "English title is required" }),
  titleZh: optionalText,
  standfirstEn: optionalText,
  standfirstZh: optionalText,
  metaTitleEn: optionalText,
  metaTitleZh: optionalText,
  topic: z.enum([
    "REVERSE_OSMOSIS",
    "CHOOSING",
    "MAINTENANCE",
    "WATER_QUALITY",
    "SUSTAINABILITY",
    "COMPANY",
  ]),
  // Comma-separated in the form, split into an array before persisting —
  // matches lib/articles.ts's `keywords: string[]` (primary first).
  keywordsEnText: optionalText,
  keywordsZhText: optionalText,
  imagePath: optionalText,
  imageAltEn: optionalText,
  imageAltZh: optionalText,
});

export const articleBlockInputSchema = z.object({
  kind: z.enum(["P", "H", "LIST"]),
  textEn: optionalText,
  textZh: optionalText,
  // Newline-separated in the form, split into an array before persisting.
  itemsEnText: optionalText,
  itemsZhText: optionalText,
});

export const guideInputSchema = z.object({
  slug: slugField,
  titleEn: z.string().trim().min(1, { error: "English title is required" }),
  titleZh: optionalText,
  standfirstEn: optionalText,
  standfirstZh: optionalText,
  imagePath: optionalText,
  imageAltEn: optionalText,
  imageAltZh: optionalText,
  // Optional per-reader overrides (lib/resources.ts's `imageFor`).
  imageDistributorPath: optionalText,
  imageDistributorAltEn: optionalText,
  imageDistributorAltZh: optionalText,
  imageCustomerPath: optionalText,
  imageCustomerAltEn: optionalText,
  imageCustomerAltZh: optionalText,
});

export const guideBlockInputSchema = z.object({
  kind: z.enum(["P", "H", "LIST", "TABLE"]),
  textEn: optionalText,
  textZh: optionalText,
  // Newline-separated in the form, split into an array before persisting.
  itemsEnText: optionalText,
  itemsZhText: optionalText,
});

export const manualFactInputSchema = z.object({
  key: z.enum(["FEED_TDS", "FEED_MEMBRANE", "SERVICE_COMBO_FILTER", "SERVICE_MEMBRANE"]),
  valueEn: z.string().trim().min(1, { error: "English value is required" }),
  valueZh: optionalText,
  noteEn: optionalText,
  noteZh: optionalText,
});

export const userInviteSchema = z.object({
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
  password: z.string().min(8, { error: "Password must be at least 8 characters" }),
  role: z.enum(["OWNER", "STAFF"]),
});

export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
});

// How a workspace reaches its live site. Set by STEEZ from the admin page,
// never by the client: a wrong hook silently stops every publish.
export const tenantSiteSchema = z.object({
  // Deploy hook that rebuilds the tenant's public static site. Optional, but
  // must be a real https URL when present — it's fetched server-side.
  deployHookUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v))
    .refine((v) => v === undefined || /^https:\/\/\S+$/.test(v), {
      error: "Must be an https:// URL",
    })
    .optional(),
  // The tenant's live public site, e.g. https://komibright.com — used to
  // build "View live" links (products, articles, guides) instead of a
  // hardcoded domain that only ever matched one tenant.
  siteUrl: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : v.replace(/\/+$/, "")))
    .refine((v) => v === undefined || /^https:\/\/\S+$/.test(v), {
      error: "Must be an https:// URL",
    })
    .optional(),
});

export const createTenantSchema = z.object({
  name: z.string().trim().min(1, { error: "Workspace name is required" }),
  slug: slugField,
  ownerEmail: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
  ownerPassword: z
    .string()
    .min(8, { error: "Password must be at least 8 characters" }),
});

export const passwordChangeSchema = z.object({
  currentPassword: z.string().min(1, { error: "Current password is required" }),
  newPassword: z.string().min(8, { error: "New password must be at least 8 characters" }),
});

export const totpConfirmSchema = z.object({
  code: z.string().trim().regex(/^\d{6}$/, { error: "Enter the 6-digit code" }),
});

export const totpDisableSchema = z.object({
  password: z.string().min(1, { error: "Password is required" }),
});

export const forgotPasswordSchema = z.object({
  email: z.email({ error: "Enter a valid email" }).trim().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, { error: "Missing token" }),
  password: z.string().min(8, { error: "Password must be at least 8 characters" }),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductContentInput = z.infer<typeof productContentInputSchema>;
export type ProductFitInput = z.infer<typeof productFitInputSchema>;
export type FinishInput = z.infer<typeof finishInputSchema>;
export type ArticleInput = z.infer<typeof articleInputSchema>;
export type ArticleBlockInput = z.infer<typeof articleBlockInputSchema>;
export type GuideInput = z.infer<typeof guideInputSchema>;
export type GuideBlockInput = z.infer<typeof guideBlockInputSchema>;
export type ManualFactInput = z.infer<typeof manualFactInputSchema>;
