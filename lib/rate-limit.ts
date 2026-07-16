import "server-only";
import { prisma } from "@/lib/db";

/**
 * Sliding-window rate limit backed by Postgres — no Redis needed at this
 * traffic scale. Counts RateLimitHit rows for `key` within `windowMs`; if
 * under `max`, records a hit and allows. Also prunes old rows for the same
 * key so the table doesn't grow unbounded.
 */
export async function checkRateLimit(
  key: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<boolean> {
  const since = new Date(Date.now() - windowMs);

  const count = await prisma.rateLimitHit.count({
    where: { key, createdAt: { gte: since } },
  });
  if (count >= max) return false;

  await Promise.all([
    prisma.rateLimitHit.create({ data: { key } }),
    prisma.rateLimitHit.deleteMany({
      where: { key, createdAt: { lt: since } },
    }),
  ]);
  return true;
}
