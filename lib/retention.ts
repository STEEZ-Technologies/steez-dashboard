import "server-only";
import { prisma } from "@/lib/db";
import { RATE_LIMIT_MAX_AGE_MS } from "@/lib/rate-limit";

/* HOW LONG THE DASHBOARD KEEPS WHAT THE CLIENT SITES SEND IT.
 *
 * These numbers are printed in the client sites' privacy policies
 * (komibright-v2 lib/privacy.ts), so changing one here means changing the
 * wording there in the same breath.
 *
 * - Page views and product events: 14 months — a full year to compare
 *   against plus a margin, the same default Google Analytics uses.
 * - Rate-limit rows: a day. They hold a keyed hash rather than an IP or an
 *   email (lib/rate-limit.ts), and the longest window any caller uses is
 *   15 minutes; without this, a key that never came back stayed forever.
 *
 * NOT YET COVERED: the backup files in OSS (lib/backup.ts). Each carries the
 * last 90 days of events and every lead, and none is ever deleted, so until
 * the bucket has an expiry the limits above hold for the database only.
 */
export const ANALYTICS_RETENTION_DAYS = 427; // 14 months

const DAY_MS = 24 * 60 * 60_000;

export async function runRetention(now = Date.now()) {
  const analyticsBefore = new Date(now - ANALYTICS_RETENTION_DAYS * DAY_MS);
  const rateBefore = new Date(now - RATE_LIMIT_MAX_AGE_MS);

  const [pageViews, productEvents, rateLimitHits] = await Promise.all([
    prisma.pageView.deleteMany({ where: { createdAt: { lt: analyticsBefore } } }),
    prisma.productEvent.deleteMany({ where: { createdAt: { lt: analyticsBefore } } }),
    prisma.rateLimitHit.deleteMany({ where: { createdAt: { lt: rateBefore } } }),
  ]);

  return {
    pageViews: pageViews.count,
    productEvents: productEvents.count,
    rateLimitHits: rateLimitHits.count,
  };
}
