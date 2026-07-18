import { NextResponse } from "next/server";
import geoip from "geoip-lite";
import { prisma } from "@/lib/db";
import { corsHeadersFor, isBot } from "@/lib/cors";
import { checkRateLimit } from "@/lib/rate-limit";

// Public, unauthenticated buyer-enquiry capture. Mirrors the track endpoint's
// shape (tenant → bot → rate limit → validate → write) but is much more
// tightly rate limited: a real person submits a contact form a couple of times
// at most, so anything above that is spam.

const MAX_MESSAGE = 5000;
const MAX_FIELD = 200;

function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

/** Trimmed string within a length cap, or undefined when absent/blank. */
function str(value: unknown, max = MAX_FIELD): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  return trimmed.slice(0, max);
}

export async function OPTIONS(request: Request) {
  return new Response(null, {
    status: 204,
    headers: corsHeadersFor(request.headers.get("origin")),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ tenantSlug: string }> },
) {
  const CORS = corsHeadersFor(request.headers.get("origin"));
  const { tenantSlug } = await params;

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404, headers: CORS });
  }

  const ua = request.headers.get("user-agent");
  if (isBot(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" }, { headers: CORS });
  }

  // Far stricter than /track — this writes buyer-visible records that a human
  // then has to triage, so spam is expensive in attention, not just storage.
  const ip = clientIp(request) ?? "unknown";
  const withinLimit = await checkRateLimit(`lead:${ip}`, {
    max: 5,
    windowMs: 10 * 60_000,
  });
  if (!withinLimit) {
    return NextResponse.json({ error: "Too many requests" }, { status: 429, headers: CORS });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400, headers: CORS });
  }
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400, headers: CORS });
  }

  const raw = body as Record<string, unknown>;
  const email = str(raw.email);
  const phone = str(raw.phone);

  // A lead with no way to reply is worthless — reject rather than store noise.
  if (!email && !phone) {
    return NextResponse.json(
      { error: "email or phone is required" },
      { status: 400, headers: CORS },
    );
  }

  // Optional product attribution: the site sends the slug it already knows.
  let productId: string | null = null;
  const productSlug = str(raw.productSlug);
  if (productSlug) {
    const product = await prisma.product.findFirst({
      where: { tenantId: tenant.id, slug: productSlug },
      select: { id: true },
    });
    productId = product?.id ?? null;
  }

  const country = ip !== "unknown" ? geoip.lookup(ip)?.country ?? null : null;

  await prisma.lead.create({
    data: {
      tenantId: tenant.id,
      productId,
      name: str(raw.name),
      email,
      phone,
      company: str(raw.company),
      message: str(raw.message, MAX_MESSAGE),
      sessionId: str(raw.sessionId),
      path: str(raw.path, 500),
      referrer: str(raw.referrer, 500),
      country,
    },
  });

  return NextResponse.json({ ok: true }, { headers: CORS });
}
