/**
 * Pure, dependency-free analytics helpers. No "server-only", no Prisma —
 * so they can be unit-tested in isolation (see lib/__tests__/analytics.test.ts).
 */

export function daysAgo(days: number, from: Date = new Date()): Date {
  const d = new Date(from);
  d.setDate(d.getDate() - days);
  return d;
}

// Percentage change vs the previous period. Returns null when there's no
// comparable prior data (previous === 0) — a "+100%" there is misleading, so
// callers should render no delta badge instead.
export function pctDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return Math.round(((current - previous) / previous) * 100);
}

/** Click-through rate as an integer percentage, clamped to [0, 100]. */
export function ctrPercent(clicks: number, views: number): number {
  if (views <= 0) return 0;
  return Math.min(100, Math.round((clicks / views) * 100));
}

/** Host portion of a referrer URL; "Direct" when empty/unparseable. */
export function hostOf(referrer: string | null): string {
  if (!referrer) return "Direct";
  try {
    return new URL(referrer).hostname.replace(/^www\./, "") || "Direct";
  } catch {
    return "Direct";
  }
}

export function deviceOf(ua: string | null): "Mobile" | "Tablet" | "Desktop" {
  if (!ua) return "Desktop";
  if (/iPad|Tablet/i.test(ua)) return "Tablet";
  if (/Mobi|Android|iPhone/i.test(ua)) return "Mobile";
  return "Desktop";
}

/** Bucket a list of {createdAt} rows into YYYY-MM-DD → count, sorted. */
export function bucketByDay(rows: { createdAt: Date }[]): {
  date: string;
  count: number;
}[] {
  const counts = new Map<string, number>();
  for (const r of rows) {
    const day = r.createdAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
