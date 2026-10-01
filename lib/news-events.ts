import type { NewsEvent } from "@/app/generated/prisma/client";

type Dated = Pick<NewsEvent, "dating" | "startDate" | "endDate" | "year">;

const iso = (d: Date) => d.toISOString().slice(0, 10);

/** Every day of the event as YYYY-MM-DD, first to last — what the site's
 *  homepage lays out day by day. Empty unless the event has set dates. */
export function eventDays(e: Dated): string[] {
  if (e.dating !== "DAYS" || !e.startDate) return [];
  const end = e.endDate && e.endDate > e.startDate ? e.endDate : e.startDate;
  const days: string[] = [];
  // Capped so a mistyped year can't produce a 3,000-entry array.
  for (let d = new Date(e.startDate); d <= end && days.length < 31; d.setUTCDate(d.getUTCDate() + 1)) {
    days.push(iso(d));
  }
  return days;
}

/** Upcoming until its last day has passed (UTC date, matching the site's
 *  build guard). */
export function isUpcoming(e: Dated, today = iso(new Date())): boolean {
  const days = eventDays(e);
  return days.length > 0 && days[days.length - 1] >= today;
}

/** "28–30 Oct 2026", "9 Mar 2024", "2023", or null — the dashboard's own
 *  list only; the site formats its own dates per language. */
export function formatWhen(e: Dated): string | null {
  if (e.dating === "YEAR") return e.year ? String(e.year) : null;
  const days = eventDays(e);
  if (days.length === 0) return null;
  const fmt = (s: string, opts: Intl.DateTimeFormatOptions) =>
    new Date(`${s}T12:00:00Z`).toLocaleDateString("en-GB", { timeZone: "UTC", ...opts });
  const first = days[0];
  const last = days[days.length - 1];
  const full = { day: "numeric", month: "short", year: "numeric" } as const;
  if (first === last) return fmt(first, full);
  if (first.slice(0, 7) === last.slice(0, 7)) return `${fmt(first, { day: "numeric" })}–${fmt(last, full)}`;
  if (first.slice(0, 4) === last.slice(0, 4))
    return `${fmt(first, { day: "numeric", month: "short" })} – ${fmt(last, full)}`;
  return `${fmt(first, full)} – ${fmt(last, full)}`;
}
