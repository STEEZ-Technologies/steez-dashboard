/**
 * How finished a product's catalogue entry is. Pure — unit-tested.
 * Only counts fields a client can fill in from the product editor, so every
 * gap it reports is one they can actually close.
 */

export type CompletenessKey =
  | "nameZh"
  | "description"
  | "descriptionZh"
  | "photo"
  | "category"
  | "specs";

export type CompletenessInput = {
  nameZh: string | null;
  description: string | null;
  descriptionZh: string | null;
  imagePath: string | null;
  galleryCount: number;
  categoryId: string | null;
  specs: unknown;
};

export type Completeness = {
  done: number;
  total: number;
  /** Which edit-page tab to open to fix each gap. */
  missing: { key: CompletenessKey; tab: "basics" | "media" | "specs" }[];
};

const filled = (s: string | null) => !!s && s.trim().length > 0;

function hasSpecs(specs: unknown): boolean {
  if (!specs || typeof specs !== "object") return false;
  return Object.values(specs as Record<string, unknown>).some(
    (v) => typeof v === "string" && v.trim().length > 0,
  );
}

/** `lean`: KomiBright's site ignores the main product photo and shows the
 *  gallery instead, so a gallery image is what counts there. */
export function productCompleteness(
  p: CompletenessInput,
  { lean = false }: { lean?: boolean } = {},
): Completeness {
  const checks: [CompletenessKey, boolean, Completeness["missing"][number]["tab"]][] = [
    ["nameZh", filled(p.nameZh), "basics"],
    ["description", filled(p.description), "basics"],
    ["descriptionZh", filled(p.descriptionZh), "basics"],
    [
      "photo",
      lean ? p.galleryCount > 0 : filled(p.imagePath) || p.galleryCount > 0,
      lean ? "media" : "basics",
    ],
    ["category", !!p.categoryId, "basics"],
    ["specs", hasSpecs(p.specs), "specs"],
  ];
  const missing = checks.filter(([, ok]) => !ok).map(([key, , tab]) => ({ key, tab }));
  return { done: checks.length - missing.length, total: checks.length, missing };
}
