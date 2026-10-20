import { z } from "zod";
import { parseYouTube } from "@/lib/youtube";

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

/** "a@x.com, b@y.com" (commas, semicolons, spaces or new lines) → the
    addresses, lower-cased and de-duplicated. */
export function splitEmails(raw: string): string[] {
  return [...new Set(raw.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean))];
}

export const tenantSettingsSchema = z.object({
  name: z.string().trim().min(1, { error: "Name is required" }),
  // Absent from the form → undefined → left as stored.
  leadAlertEmails: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : splitEmails(v)))
    .refine((list) => list === undefined || list.length <= 5, {
      error: "Up to five notification emails",
    })
    .refine((list) => list === undefined || list.every((e) => z.email().safeParse(e).success), {
      error: "One of the notification emails isn't a valid address",
    }),
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
const isoDay = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.iso.date({ error: "Use a real date" }).optional());

export const newsEventInputSchema = z
  .object({
    slug: slugField,
    kind: z.enum(["EXHIBITION", "VISIT", "PRESS", "PRODUCT"]),
    titleEn: z.string().trim().min(1, { error: "English title is required" }),
    titleZh: optionalText,
    placeEn: optionalText,
    placeZh: optionalText,
    booth: optionalText,
    dating: z.enum(["DAYS", "YEAR", "NONE"]),
    startDate: isoDay,
    endDate: isoDay,
    year: z
      .string()
      .trim()
      .transform((v) => (v === "" ? undefined : Number(v)))
      .pipe(z.number().int().min(1900).max(2100, { error: "Use a four-digit year" }).optional()),
    imagePath: optionalText,
    imageAltEn: optionalText,
    imageAltZh: optionalText,
  })
  .refine((v) => v.dating !== "DAYS" || v.startDate, {
    error: "Pick the first day",
    path: ["startDate"],
  })
  .refine((v) => v.dating !== "YEAR" || v.year, { error: "Enter the year", path: ["year"] })
  .refine((v) => !v.startDate || !v.endDate || v.endDate >= v.startDate, {
    error: "The last day can't be before the first",
    path: ["endDate"],
  });

export const videoInputSchema = z.object({
  video: z
    .string()
    .trim()
    .min(1, { error: "Paste the video's YouTube link" })
    .transform((v, ctx) => {
      const parsed = parseYouTube(v);
      if (!parsed) {
        ctx.addIssue({ code: "custom", message: "That isn't a YouTube video link" });
        return z.NEVER;
      }
      return parsed;
    }),
  kind: z.enum(["PRESS", "DISTRIBUTOR", "TRAINING", "PRODUCT"]),
  titleEn: z.string().trim().min(1, { error: "English title is required" }),
  titleZh: optionalText,
});

export type ArticleInput = z.infer<typeof articleInputSchema>;
export type VideoInput = z.infer<typeof videoInputSchema>;
export type NewsEventInput = z.infer<typeof newsEventInputSchema>;
export type ArticleBlockInput = z.infer<typeof articleBlockInputSchema>;
export type GuideInput = z.infer<typeof guideInputSchema>;
export type GuideBlockInput = z.infer<typeof guideBlockInputSchema>;
export type ManualFactInput = z.infer<typeof manualFactInputSchema>;

// Contact details a site prints as written. Blank is "not published": the
// site leaves the line out rather than printing an empty one.
const optionalEmail = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(z.email({ error: "That isn't an email address" }).optional());

const optionalUrl = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v))
  .pipe(
    z
      .string()
      .regex(/^https?:\/\/\S+$/, { error: "Links start with https://" })
      .optional(),
  );

// Printed as a bare domain ("www.komibright.com") and linked with https://.
const optionalWebsite = z
  .string()
  .trim()
  .transform((v) => (v === "" ? undefined : v.replace(/^https?:\/\//, "").replace(/\/$/, "")))
  .pipe(
    z
      .string()
      .regex(/^[\w.-]+\.[a-z]{2,}(\/\S*)?$/i, { error: "That isn't a website address" })
      .optional(),
  );

const SOCIAL_NETWORKS = ["wechat", "linkedin", "facebook", "instagram", "youtube", "x", "tiktok", "weibo"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

export const companyProfileInputSchema = z.object({
  email: optionalEmail,
  phone: optionalText,
  whatsapp: optionalText,
  icpNumber: optionalText,
  catalogueUrl: optionalUrl,
  salesName: optionalText,
  salesWhatsapp: optionalText,
  salesEmail: optionalEmail,
  salesWeb: optionalWebsite,
  // One "network url" pair per line, e.g. "linkedin https://…".
  socials: z
    .string()
    .trim()
    .transform((v, ctx) => {
      const rows: { network: SocialNetwork; url: string }[] = [];
      for (const line of v.split("\n").map((l) => l.trim()).filter(Boolean)) {
        const [network, url] = line.split(/\s+/, 2);
        const n = network.toLowerCase() as SocialNetwork;
        if (!SOCIAL_NETWORKS.includes(n) || !/^https?:\/\/\S+$/.test(url ?? "")) {
          ctx.addIssue({
            code: "custom",
            message: `Social links: "${line}" should be a network (${SOCIAL_NETWORKS.join(", ")}) and an https:// link`,
          });
          return z.NEVER;
        }
        rows.push({ network: n, url });
      }
      return rows;
    }),
});

export const officeInputSchema = z.object({
  key: slugField,
  tel: optionalText,
  fax: optionalText,
  email: optionalEmail,
  web: optionalWebsite,
  line: optionalText,
  lat: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : Number(v)))
    .pipe(z.number({ error: "Latitude is a number" }).min(-90).max(90).optional()),
  lon: z
    .string()
    .trim()
    .transform((v) => (v === "" ? undefined : Number(v)))
    .pipe(z.number({ error: "Longitude is a number" }).min(-180).max(180).optional()),
});

export type CompanyProfileInput = z.infer<typeof companyProfileInputSchema>;
export type OfficeInput = z.infer<typeof officeInputSchema>;
export { SOCIAL_NETWORKS };
