import { NextResponse } from "next/server";
import geoip from "geoip-lite";
import { prisma } from "@/lib/db";
import { corsHeadersFor, isBot } from "@/lib/cors";

function clientIp(request: Request): string | null {
  const xff = request.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return request.headers.get("x-real-ip");
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

  // Drop obvious bots/crawlers so analytics reflect real buyers.
  const ua = request.headers.get("user-agent");
  if (isBot(ua)) {
    return NextResponse.json({ ok: true, skipped: "bot" }, { headers: CORS });
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

  if (kind === "page_view") {
    const ip = clientIp(request);
    const country = ip ? geoip.lookup(ip)?.country ?? null : null;
    await prisma.pageView.create({
      data: {
        tenantId: tenant.id,
        sessionId,
        path: typeof path === "string" ? path : "",
        referrer: typeof referrer === "string" ? referrer : undefined,
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
        path: typeof path === "string" ? path : undefined,
        referrer: typeof referrer === "string" ? referrer : undefined,
      },
    });
    return NextResponse.json({ ok: true }, { headers: CORS });
  }

  return NextResponse.json(
    { error: "kind must be page_view or product_event" },
    { status: 400, headers: CORS },
  );
}
