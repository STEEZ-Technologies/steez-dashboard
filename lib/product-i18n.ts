/* Product text beyond English and Chinese. KomiBright's site is published in
 * six languages; the dashboard kept only two columns per field, so the other
 * four live in one Json column per row (Product.i18n, ProductContent.textI18n,
 * ProductApplication.textI18n). A language missing from the object means "not
 * edited here", and the site keeps its own copy for it. */

export const EXTRA_LANGS = ["fr", "it", "es", "ja"] as const;
export type ExtraLang = (typeof EXTRA_LANGS)[number];

export type TextI18n = Partial<Record<ExtraLang, string>>;
export type ProductI18n = Partial<Record<ExtraLang, { name?: string; description?: string }>>;

const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : undefined);
const obj = (v: unknown) =>
  v && typeof v === "object" && !Array.isArray(v) ? (v as Record<string, unknown>) : {};

/** A stored `{ fr, it, es, ja }` object, reduced to its non-blank strings. */
export function readTextI18n(v: unknown): TextI18n {
  const o = obj(v);
  const out: TextI18n = {};
  for (const l of EXTRA_LANGS) {
    const s = str(o[l]);
    if (s) out[l] = s;
  }
  return out;
}

/** A stored Product.i18n, reduced to its non-blank strings. */
export function readProductI18n(v: unknown): ProductI18n {
  const o = obj(v);
  const out: ProductI18n = {};
  for (const l of EXTRA_LANGS) {
    const entry = obj(o[l]);
    const name = str(entry.name);
    const description = str(entry.description);
    if (name || description) out[l] = { ...(name && { name }), ...(description && { description }) };
  }
  return out;
}

export const isEmptyI18n = (v: object) => Object.keys(v).length === 0;

/** `name_fr`, `description_es`, … from a product form. Only called when the
    form actually rendered those fields (it posts `i18nFields=on`). */
export function productI18nFromForm(formData: FormData): ProductI18n {
  const raw: Record<string, unknown> = {};
  for (const l of EXTRA_LANGS) {
    raw[l] = { name: formData.get(`name_${l}`), description: formData.get(`description_${l}`) };
  }
  return readProductI18n(raw);
}
