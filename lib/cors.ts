// CORS for the public read/track endpoints. Origins allowlist comes from the
// PUBLIC_ALLOWED_ORIGINS env var (comma-separated). If unset, falls back to
// "*" (dev convenience). Once Konlito's real domain is locked in, set the env.
function allowlist(): string[] {
  return (process.env.PUBLIC_ALLOWED_ORIGINS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

export function corsHeadersFor(origin: string | null): Record<string, string> {
  const list = allowlist();
  let allow = "*";
  if (list.length > 0) {
    allow = origin && list.includes(origin) ? origin : list[0];
  }
  return {
    "Access-Control-Allow-Origin": allow,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    Vary: "Origin",
  };
}

// Backward-compatible default (used where no request origin is available).
export const PUBLIC_CORS_HEADERS = corsHeadersFor(null);

const BOT_RE = /bot|crawler|spider|slurp|preview|curl|wget|headless|monitor|scan/i;

export function isBot(userAgent: string | null | undefined): boolean {
  return !!userAgent && BOT_RE.test(userAgent);
}
