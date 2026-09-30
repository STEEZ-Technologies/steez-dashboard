/**
 * Pure helpers that turn one visitor's raw PageView/ProductEvent rows into
 * the "before enquiring" timeline on an enquiry. No Prisma — unit-tested.
 */

export type RawStep = {
  kind: "page_view" | "product_view" | "product_click";
  /** Page path for page views; product id for product events. */
  key: string;
  /** Display text: the path for page views, product name/model for events. */
  detail: string;
  referrer?: string | null;
  at: Date;
};

export type JourneyStep = Omit<RawStep, "referrer"> & { count: number };

export type JourneySummary = {
  visits: number;
  productsViewed: number;
  firstSeen: Date | null;
  /** First external referrer of the session, when there was one. */
  firstReferrer: string | null;
};

/** Rows fired by one navigation (a product page logs a page view and one or
 *  two VIEW events within milliseconds) are one step, not three. */
const SAME_ACTION_MS = 2_000;
/** A gap longer than this starts a new visit. */
const VISIT_GAP_MS = 30 * 60_000;

const isProductPath = (path: string) => /^\/products?\/[^/]+/.test(path);

export function buildJourney(rows: RawStep[]): {
  steps: JourneyStep[];
  summary: JourneySummary;
} {
  const sorted = [...rows].sort((a, b) => a.at.getTime() - b.at.getTime());

  // A product page's page view duplicates its product VIEW event, which has
  // the nicer label (the product name) — keep the event.
  const withoutDupPages = sorted.filter(
    (r) =>
      !(
        r.kind === "page_view" &&
        isProductPath(r.key) &&
        sorted.some(
          (o) =>
            o.kind === "product_view" &&
            Math.abs(o.at.getTime() - r.at.getTime()) <= SAME_ACTION_MS,
        )
      ),
  );

  const steps: JourneyStep[] = [];
  let lastAt: number | null = null;
  for (const r of withoutDupPages) {
    const prev = steps[steps.length - 1];
    if (prev && prev.kind === r.kind && prev.key === r.key) {
      // Same thing again: a double-fired event is noise, a real revisit counts.
      if (lastAt !== null && r.at.getTime() - lastAt > SAME_ACTION_MS) prev.count += 1;
    } else {
      steps.push({ kind: r.kind, key: r.key, detail: r.detail, at: r.at, count: 1 });
    }
    lastAt = r.at.getTime();
  }

  let visits = 0;
  let prevAt: number | null = null;
  for (const r of sorted) {
    if (prevAt === null || r.at.getTime() - prevAt > VISIT_GAP_MS) visits += 1;
    prevAt = r.at.getTime();
  }

  return {
    steps,
    summary: {
      visits,
      productsViewed: new Set(
        sorted.filter((r) => r.kind !== "page_view").map((r) => r.key),
      ).size,
      firstSeen: sorted[0]?.at ?? null,
      firstReferrer: sorted.find((r) => r.referrer)?.referrer ?? null,
    },
  };
}
