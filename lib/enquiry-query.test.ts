import { describe, expect, it } from "vitest";
import { enquiryHref, enquiryWhere, parseEnquiryQuery, reportParameters, reportPeriod } from "./enquiry-query";

const end = new Date("2026-11-25T10:15:30.456Z");

describe("enquiry report links", () => {
  it.each([7, 30, 90])("reconciles the %i-day received and won filters", (days) => {
    const period = reportPeriod(days, end);
    expect(period.end.getTime() - period.start.getTime()).toBe(days * 86_400_000);
    for (const report of ["received", "won"] as const) {
      const href = enquiryHref(reportParameters(report, period));
      const params = Object.fromEntries(new URL(href, "http://localhost").searchParams);
      const inbox = enquiryWhere("signed-in", parseEnquiryQuery(params, false));
      expect(inbox).toEqual(enquiryWhere("signed-in", { report, period }));
      expect(inbox).toEqual({
        tenantId: "signed-in",
        AND: [report === "won"
          ? { status: "WON", closedAt: { gte: period.start, lt: end } }
          : { status: { not: "ARCHIVED" }, createdAt: { gte: period.start, lt: end } }],
      });
    }
  });

  it("keeps IP country independent of buyer country and market outcomes tied to creation", () => {
    const period = reportPeriod(30, end);
    const filter = parseEnquiryQuery({ ...reportParameters("market", period), country: "US", buyerCountry: "CN", status: "WON" }, false);
    expect(enquiryWhere("tenant-a", filter)).toEqual({
      tenantId: "tenant-a",
      AND: [{ createdAt: { gte: period.start, lt: end }, status: { not: "ARCHIVED" } }, { status: "WON" }, { country: "US" }],
    });
  });

  it("preserves Kawada's archive and missing-attribution semantics", () => {
    const period = reportPeriod(30, end);
    const filters = { buyerCountry: "CN" };
    const query = parseEnquiryQuery({
      ...reportParameters("kawada", period), ...filters, segmentField: "formLanguage", segmentMissing: "1",
    }, true);
    expect(query.segment).toEqual({ field: "formLanguage", value: null });
    expect(enquiryWhere("tenant-a", query)).toEqual({
      tenantId: "tenant-a",
      AND: [{ createdAt: { gte: period.start, lt: end } }, filters, { formLanguage: null }],
    });
  });
});

describe("inbox query validation", () => {
  it.each(["0", "-2", "1.5", "1e4", "99999999999999999999", ["2", "3"]])("defaults invalid page %s to one", (page) => {
    expect(parseEnquiryQuery({ page }, false).requestedPage).toBe(1);
  });

  it("uses only the session tenant and validates dates, status, attribution and search", () => {
    const query = parseEnquiryQuery({
      tenantId: "another", report: "won", from: "2026-11-20", to: end.toISOString(),
      status: "PAID", buyerCountry: "invalid", q: "  ref_%  ", page: "4",
    }, true);
    expect(query.parameters).toEqual({ q: "ref_%" });
    expect(query.requestedPage).toBe(4);
    expect(enquiryWhere("signed-in", query)).toMatchObject({
      tenantId: "signed-in",
      AND: [{ OR: expect.arrayContaining([{ name: { contains: "ref\\_\\%", mode: "insensitive" } }]) }],
    });
  });
});
