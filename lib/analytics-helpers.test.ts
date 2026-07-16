import { describe, it, expect } from "vitest";
import {
  pctDelta,
  ctrPercent,
  hostOf,
  deviceOf,
  bucketByDay,
} from "./analytics-helpers";

describe("pctDelta", () => {
  it("computes percentage change", () => {
    expect(pctDelta(150, 100)).toBe(50);
    expect(pctDelta(50, 100)).toBe(-50);
  });
  it("returns null when there's no comparable prior period (previous 0)", () => {
    expect(pctDelta(5, 0)).toBeNull();
    expect(pctDelta(0, 0)).toBeNull();
  });
});

describe("ctrPercent", () => {
  it("computes clicks / views as a percentage", () => {
    expect(ctrPercent(25, 100)).toBe(25);
  });
  it("clamps to 100 when clicks exceed views (dirty data)", () => {
    expect(ctrPercent(300, 100)).toBe(100);
  });
  it("returns 0 when there are no views", () => {
    expect(ctrPercent(5, 0)).toBe(0);
  });
});

describe("hostOf", () => {
  it("strips protocol and www", () => {
    expect(hostOf("https://www.google.com/search?q=x")).toBe("google.com");
  });
  it("returns Direct for null or unparseable", () => {
    expect(hostOf(null)).toBe("Direct");
    expect(hostOf("not a url")).toBe("Direct");
  });
});

describe("deviceOf", () => {
  it("detects mobile", () => {
    expect(deviceOf("Mozilla/5.0 (iPhone; ...) Mobile")).toBe("Mobile");
  });
  it("detects tablet", () => {
    expect(deviceOf("Mozilla/5.0 (iPad; ...)")).toBe("Tablet");
  });
  it("defaults to desktop", () => {
    expect(deviceOf("Mozilla/5.0 (Macintosh; ...)")).toBe("Desktop");
    expect(deviceOf(null)).toBe("Desktop");
  });
});

describe("bucketByDay", () => {
  it("groups rows by ISO day and sorts ascending", () => {
    const rows = [
      { createdAt: new Date("2026-01-02T10:00:00Z") },
      { createdAt: new Date("2026-01-01T09:00:00Z") },
      { createdAt: new Date("2026-01-02T22:00:00Z") },
    ];
    expect(bucketByDay(rows)).toEqual([
      { date: "2026-01-01", count: 1 },
      { date: "2026-01-02", count: 2 },
    ]);
  });
  it("returns empty array for no rows", () => {
    expect(bucketByDay([])).toEqual([]);
  });
});
