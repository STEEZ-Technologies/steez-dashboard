import "server-only";
import { createHmac } from "node:crypto";
import { prisma } from "@/lib/db";

/** Rate-limit rows older than this are deleted by the retention cron
 *  (lib/retention.ts). Must stay longer than the longest window any caller
 *  passes — today 15 minutes. */
export const RATE_LIMIT_MAX_AGE_MS = 24 * 60 * 60_000;

/**
 * The key as stored: its first segment ("track", "login", …) kept readable, the
 * identifying part (an IP address or an email) replaced by an HMAC under
 * AUTH_SECRET. The limiter only ever compares a key with itself, so a keyed
 * hash counts exactly as the raw value did, and the table no longer holds
 * visitors' IP addresses — the client sites' privacy policies depend on that.
 * Keyed rather than a bare SHA-256 because the IPv4 space is small enough to
 * hash in full and reverse.
 */
function storedKey(key: string): string {
  /* The FIRST colon: an IPv6 address is full of them, and splitting at the
     last would leave most of the address in the clear. */
  const at = key.indexOf(":");
  const prefix = at === -1 ? "" : key.slice(0, at + 1);
  const value = at === -1 ? key : key.slice(at + 1);
  const digest = createHmac("sha256", process.env.AUTH_SECRET ?? "")
    .update(value)
    .digest("hex")
    .slice(0, 32);
  return prefix + digest;
}

/**
 * Sliding-window rate limit backed by Postgres — no Redis needed at this
 * traffic scale. Counts RateLimitHit rows for `key` within `windowMs`; if
 * under `max`, records a hit and allows. Also prunes old rows for the same
 * key so the table doesn't grow unbounded; rows for keys that never come back
 * are removed by the retention cron.
 */
export async function checkRateLimit(
  rawKey: string,
  { max, windowMs }: { max: number; windowMs: number },
): Promise<boolean> {
  const key = storedKey(rawKey);
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

/** Drops every recorded hit for `key` — e.g. after a successful login. */
export async function clearRateLimit(rawKey: string): Promise<void> {
  await prisma.rateLimitHit.deleteMany({ where: { key: storedKey(rawKey) } });
}
