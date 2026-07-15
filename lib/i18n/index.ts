import "server-only";
import { cookies } from "next/headers";
import { en, type Dictionary } from "./dictionaries/en";
import { zh } from "./dictionaries/zh";

export type Locale = "en" | "zh";
export const LOCALES: Locale[] = ["en", "zh"];
export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE: Locale = "en";

const DICTS: Record<Locale, Dictionary> = { en, zh };

export function isLocale(value: string | undefined): value is Locale {
  return value === "en" || value === "zh";
}

/** Read the active locale from the cookie (server-side). */
export async function getLocale(): Promise<Locale> {
  const store = await cookies();
  const raw = store.get(LOCALE_COOKIE)?.value;
  return isLocale(raw) ? raw : DEFAULT_LOCALE;
}

export function getDictionaryFor(locale: Locale): Dictionary {
  return DICTS[locale];
}

export async function getDictionary(): Promise<Dictionary> {
  return DICTS[await getLocale()];
}

export type { Dictionary };
