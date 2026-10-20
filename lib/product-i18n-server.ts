import { Prisma } from "@/app/generated/prisma/client";
import { isEmptyI18n, readTextI18n, type TextI18n } from "@/lib/product-i18n";

/* Kept apart from lib/product-i18n.ts, which client components import, so
   the Prisma runtime never lands in a browser bundle. */

/** The `textI18n` column for a row save: absent when the editor didn't send
    the four extra languages (leave what's stored), cleared when it sent them
    all blank. */
export function i18nColumn(v: TextI18n | undefined) {
  if (v === undefined) return {};
  const clean = readTextI18n(v);
  return { textI18n: isEmptyI18n(clean) ? Prisma.DbNull : (clean as Prisma.InputJsonObject) };
}
