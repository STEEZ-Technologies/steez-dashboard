import { NextResponse } from "next/server";
import geoip from "geoip-lite";
import { prisma } from "@/lib/db";
import { corsHeadersForPublicTenant, isBot } from "@/lib/cors";
import { kawadaPath, kawadaSource, kawadaVisitId } from "@/lib/kawada-attribution";
import { checkRateLimit } from "@/lib/rate-limit";

function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip");
}

type RouteContext = { params: Promise<{ tenantSlug: string }> };

export async function OPTIONS(request: Request, { params }: RouteContext) {
  const { tenantSlug } = await params;
  return new Response(null, {
    status: 204,
    headers: corsHeadersForPublicTenant(request.headers.get("origin"), tenantSlug),
  });
}

export async function POST(
  request: Request,
  { params }: RouteContext,
) {
  const { tenantSlug } = await params;
  const origin = request.headers.get("origin");
  const CORS = corsHeadersForPublicTenant(origin, tenantSlug);

  const tenant = await prisma.tenant.findUnique({ where: { slug: tenantSlug } });
  if (!tenant) {
    return NextResponse.json({ error: "Unknown tenant" }, { status: 404, headers: CORS });
  }

  // Drop obvious bots/crawlers so analytics reflect real buyers.
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" }, { headers: CORS });
  }

  // Unauthenticated, public endpoint — cap per-IP volume so it can't be used
  // to flood the DB. 60/min covers a real visitor browsing many products.
  const ip = clientIp(request) ?? "unknown";
  const withinLimit = await checkRateLimit(`track:${ip}`, { max: 60, windowMs: 60_000 });
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

  const { kind, sessionId, path, referrer } = body as Record<string, unknown>;
  if (typeof sessionId !== "string" || !sessionId) {
    return NextResponse.json({ error: "sessionId is required" }, { status: 400, headers: CORS });
  }

  const isKawada = tenantSlug === "kawada";
  if (isKawada && !kawadaVisitId(sessionId)) {
    return NextResponse.json({ error: "Invalid sessionId" }, { status: 400, headers: CORS });
  }
  const eventPath = isKawada ? kawadaPath(path) : typeof path === "string" ? path : undefined;
  const source = isKawada ? kawadaSource(referrer, origin) : typeof referrer === "string" ? referrer : undefined;

  if (kind === "enquiry_start" && isKawada) {
    await prisma.enquiryStart.createMany({
      data: [{ tenantId: tenant.id, sessionId }],
      skipDuplicates: true,
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  if (kind === "page_view") {
    const country = ip !== "unknown" ? geoip.lookup(ip)?.country ?? null : null;
    await prisma.pageView.create({
      data: {
        tenantId: tenant.id,
        sessionId,
        path: eventPath ?? "",
        referrer: source,
        userAgent: ua ?? undefined,
        country,
      },
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  if (kind === "product_event") {
    const { eventType, productSlug, finishKey } = body as Record<string, unknown>;
    if (eventType !== "VIEW" && eventType !== "CLICK") {
      return NextResponse.json(
        { error: "eventType must be VIEW or CLICK" },
        { status: 400, headers: CORS },
      );
    }

    let productId: string | null = null;
    if (typeof productSlug === "string" && productSlug) {
      const product = await prisma.product.findFirst({
        where: { tenantId: tenant.id, slug: productSlug },
        select: { id: true },
      });
      productId = product?.id ?? null;
    }

    await prisma.productEvent.create({
      data: {
        tenantId: tenant.id,
        productId,
        finishKey: typeof finishKey === "string" ? finishKey : undefined,
        eventType,
        sessionId,
        path: eventPath,
        referrer: source,
      },
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  return NextResponse.json(
    { error: isKawada ? "Invalid Kawada event kind" : "kind must be page_view or product_event" },
    { status: 400, headers: CORS },
  );
}
