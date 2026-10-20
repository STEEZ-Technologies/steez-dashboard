import { readLocalized } from "@/lib/localized";

/** A stored heading or name in the dashboard's own language (en or zh). */
export function inDashboardLang(v: unknown, locale: "en" | "zh") {
  const o = readLocalized(v);
  if (!o) return "";
  return locale === "zh" && o.zh ? o.zh : o.en;
}
