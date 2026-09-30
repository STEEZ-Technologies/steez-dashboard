import { describe, it, expect } from "vitest";
import { buildJourney, type RawStep } from "./lead-journey-helpers";

const t0 = new Date("2026-09-01T10:00:00Z").getTime();
const at = (ms: number) => new Date(t0 + ms);
const pv = (path: string, ms: number, referrer?: string): RawStep => ({
  kind: "page_view",
  key: path,
  detail: path,
  referrer,
  at: at(ms),
});
const view = (id: string, ms: number): RawStep => ({
  kind: "product_view",
  key: id,
  detail: `Product ${id}`,
  at: at(ms),
});

describe("buildJourney", () => {
  it("returns an empty journey for no rows", () => {
    const j = buildJourney([]);
    expect(j.steps).toEqual([]);
    expect(j.summary).toEqual({
      visits: 0,
      productsViewed: 0,
      firstSeen: null,
      firstReferrer: null,
    });
  });

  it("drops a product page view that duplicates its product VIEW event", () => {
    const j = buildJourney([pv("/products/k6602/", 0), view("p1", 5)]);
    expect(j.steps.map((s) => s.kind)).toEqual(["product_view"]);
  });

  it("keeps non-product page views next to a product view", () => {
    const j = buildJourney([pv("/category/frames/", 0), view("p1", 500)]);
    expect(j.steps.map((s) => s.kind)).toEqual(["page_view", "product_view"]);
  });

  it("treats double-fired events as one and real revisits as a count", () => {
    const j = buildJourney([
      view("p1", 0),
      view("p1", 20), // double fire
      view("p1", 60_000), // came back a minute later
    ]);
    expect(j.steps).toHaveLength(1);
    expect(j.steps[0].count).toBe(2);
  });

  it("sorts rows by time regardless of input order", () => {
    const j = buildJourney([pv("/about/", 10_000), pv("/", 0)]);
    expect(j.steps.map((s) => s.key)).toEqual(["/", "/about/"]);
  });

  it("counts visits split by a 30-minute gap and distinct products", () => {
    const j = buildJourney([
      pv("/", 0, "https://www.google.com/"),
      view("p1", 1_000),
      view("p2", 2_000_000), // > 30 min later
      view("p1", 2_100_000),
    ]);
    expect(j.summary.visits).toBe(2);
    expect(j.summary.productsViewed).toBe(2);
    expect(j.summary.firstSeen).toEqual(at(0));
    expect(j.summary.firstReferrer).toBe("https://www.google.com/");
  });
});
