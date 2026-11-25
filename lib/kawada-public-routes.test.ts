import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  tenant: vi.fn(),
  pageView: vi.fn(),
  product: vi.fn(),
  productEvent: vi.fn(),
  start: vi.fn(),
  lead: vi.fn(),
  rateLimit: vi.fn(),
  after: vi.fn(),
}));

vi.mock("next/server", async (importOriginal) => ({
  ...await importOriginal<typeof import("next/server")>(),
  after: mocks.after,
}));
vi.mock("geoip-lite", () => ({ default: { lookup: () => ({ country: "US" }) } }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.rateLimit }));
vi.mock("@/lib/leadmail", () => ({ notifyNewLead: vi.fn() }));
vi.mock("@/lib/db", () => ({
  prisma: {
    tenant: { findUnique: mocks.tenant },
    pageView: { create: mocks.pageView },
    product: { findFirst: mocks.product },
    productEvent: { create: mocks.productEvent },
    enquiryStart: { createMany: mocks.start },
    lead: { create: mocks.lead },
  },
}));

import * as tracking from "@/app/api/public/[tenantSlug]/track/route";
import * as enquiries from "@/app/api/public/[tenantSlug]/lead/route";
import { kawadaSource, kawadaVisitId } from "./kawada-attribution";

const sessionId = "78fa5eb1-5ce5-4fd2-96df-300b1630f826";
const origin = "https://kawada.steez.digital";
function request(body: object, userAgent = "Mozilla/5.0") {
  return new Request(origin, {
    method: "POST",
    headers: { origin, "user-agent": userAgent, "x-forwarded-for": "8.8.8.8" },
    body: JSON.stringify(body),
  });
}
const context = (tenantSlug = "kawada") => ({ params: Promise.resolve({ tenantSlug }) });

beforeEach(() => {
  vi.clearAllMocks();
  vi.stubEnv("PUBLIC_ALLOWED_ORIGINS", "https://komibright.steez.digital");
  mocks.tenant.mockResolvedValue({ id: "tenant-1" });
  mocks.rateLimit.mockResolvedValue(true);
  mocks.product.mockResolvedValue({ id: "product-1" });
  mocks.lead.mockResolvedValue({ id: "lead-1" });
});

afterEach(() => vi.unstubAllEnvs());

describe("Kawada public tracking", () => {
  it("allows the deployed website origin on both preflight and POST and preserves other tenant behaviour", async () => {
    const preflight = new Request(origin, { method: "OPTIONS", headers: { origin } });
    const allowed = await tracking.OPTIONS(preflight, context());
    const other = await tracking.OPTIONS(preflight, context("komibright"));
    expect(allowed.status).toBe(204);
    expect(allowed.headers.get("access-control-allow-origin")).toBe(origin);
    expect(other.headers.get("access-control-allow-origin")).toBe("https://komibright.steez.digital");

    const result = await tracking.POST(request({
      kind: "page_view", sessionId, path: "/es/products/?email=discard#discard",
      referrer: "https://www.search.example/results?q=discard", name: "discard",
    }), context());
    expect(result.headers.get("access-control-allow-origin")).toBe(origin);
    expect(mocks.pageView).toHaveBeenCalledWith({ data: {
      tenantId: "tenant-1", sessionId, path: "/es/products/",
      referrer: "search.example", userAgent: "Mozilla/5.0", country: "US",
    } });
  });

  it("writes a duplicate-safe start per visit without creating a product event", async () => {
    const body = { kind: "enquiry_start", sessionId, message: "discard" };
    await Promise.all([tracking.POST(request(body), context()), tracking.POST(request(body), context())]);
    expect(mocks.start).toHaveBeenCalledTimes(2);
    expect(mocks.start).toHaveBeenCalledWith({
      data: [{ tenantId: "tenant-1", sessionId }], skipDuplicates: true,
    });
    expect(mocks.productEvent).not.toHaveBeenCalled();
    expect((await tracking.POST(request(body), context("komibright"))).status).toBe(400);
  });
});

describe("Kawada public enquiries", () => {
  it("stores canonical fields and the readable quote separately from IP country", async () => {
    const message = "Product quote and buyer's message";
    const result = await enquiries.POST(request({
      sessionId, email: "fixture@example.test", productSlug: "test-product",
      buyerCountry: "MX", productInterest: "sanitary-pads", orderVolume: "under-100000",
      formLanguage: "es", referrer: "search.example", path: "/es/contact-us/?product=test-product", message,
    }), context());

    expect(await result.json()).toEqual({ ok: true });
    expect(mocks.lead).toHaveBeenCalledWith({ data: expect.objectContaining({
      tenantId: "tenant-1", sessionId, productId: "product-1",
      buyerCountry: "MX", productInterest: "sanitary-pads", orderVolume: "under-100000",
      formLanguage: "es", country: "US", path: "/es/contact-us/", referrer: "search.example", message,
    }) });
  });

  it("keeps missing fields optional and discards unattributed source data", async () => {
    const result = await enquiries.POST(request({
      email: "fixture@example.test", referrer: "search.example",
    }), context());
    expect(result.status).toBe(200);
    const { data } = mocks.lead.mock.calls[0][0];
    expect(data.sessionId).toBeUndefined();
    expect(data.referrer).toBeUndefined();
    expect(data).not.toHaveProperty("buyerCountry");
  });

  it("stores neither invalid nor bot-skipped submissions and leaves email unscheduled", async () => {
    const invalid = await enquiries.POST(request({ email: "fixture@example.test", formLanguage: "Spanish" }), context());
    expect(invalid.status).toBe(400);
    const bot = await enquiries.POST(request({ email: "fixture@example.test" }, "Crawler"), context());
    expect(await bot.json()).toEqual({ ok: true, skipped: "bot" });
    expect(mocks.lead).not.toHaveBeenCalled();
    expect(mocks.after).not.toHaveBeenCalled();
  });

  it("never acknowledges or emails a submission when the insert fails", async () => {
    mocks.lead.mockRejectedValueOnce(new Error("database offline"));
    await expect(enquiries.POST(request({ email: "fixture@example.test" }), context())).rejects.toThrow("database offline");
    expect(mocks.after).not.toHaveBeenCalled();
  });
});

describe("Kawada acquisition attribution", () => {
  it("does not confuse missing, internal, or invalid referrers with a known source", () => {
    expect(kawadaSource(null)).toBeNull();
    expect(kawadaSource("https://kawada.steez.digital/en/products/")).toBeNull();
    expect(kawadaSource("local.example", "https://local.example")).toBeNull();
    expect(kawadaSource("https://user@example.test")).toBeNull();
    expect(kawadaSource("search.example")).toBe("search.example");
    expect(kawadaVisitId("person@example.test")).toBeUndefined();
  });
});
