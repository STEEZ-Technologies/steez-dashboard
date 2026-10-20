/* Text stored in every language a client's site publishes, as one Json
 * object per field: { en, zh?, fr?, it?, es?, ja? }. English is the one
 * language always written; a language left out falls back to English on the
 * site. Used by the newer content (company details, offices) — older models
 * keep their En/Zh columns, and products their i18n column (lib/product-i18n).
 *
 * A form posts each language as `<name>_<lang>`: `address_en`, `address_fr`. */

export const LOCALES = ["en", "zh", "fr", "it", "es", "ja"] as const;
export type Locale = (typeof LOCALES)[number];

export type LocalizedText = { en: string } & Partial<Record<Exclude<Locale, "en">, string>>;

// Trimmed, with a textarea's \r\n line breaks made \n.
const str = (v: unknown) =>
  typeof v === "string" && v.trim() ? v.trim().replace(/\r\n?/g, "\n") : undefined;

/** A stored object reduced to its non-blank strings; null without English. */
export function readLocalized(v: unknown): LocalizedText | null {
  if (!v || typeof v !== "object" || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const en = str(o.en);
  if (!en) return null;
  const out: LocalizedText = { en };
  for (const l of LOCALES) {
    const s = str(o[l]);
    if (s && l !== "en") out[l] = s;
  }
  return out;
}

/** `<name>_en`, `<name>_zh`, … from a form; null when English is blank. A
    language the form didn't render is simply absent. */
export function localizedFromForm(formData: FormData, name: string): LocalizedText | null {
  const raw: Record<string, unknown> = {};
  for (const l of LOCALES) raw[l] = formData.get(`${name}_${l}`);
  return readLocalized(raw);
}

/** A form's default values for one field, blank where a language is unwritten. */
export function localizedDefaults(v: unknown): Record<Locale, string> {
  const o = readLocalized(v);
  return Object.fromEntries(LOCALES.map((l) => [l, o?.[l] ?? ""])) as Record<Locale, string>;
}
