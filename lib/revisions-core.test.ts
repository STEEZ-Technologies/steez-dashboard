import { describe, expect, it } from "vitest";
import {
  COALESCE_MS,
  diffSnapshots,
  formatValue,
  liveVersion,
  sameSnapshot,
  shouldCoalesce,
  toSnapshot,
} from "./revisions-core";

const product = {
  id: "p1",
  tenantId: "t1",
  sortOrder: 3,
  name: "KB-C25R",
  nameZh: null,
  description: "The under-sink system.",
  specs: { Capacity: "100 GPD" },
  published: true,
  createdAt: new Date("2026-09-01T00:00:00Z"),
  updatedAt: new Date("2026-09-02T00:00:00Z"),
  fit: { id: "f1", productId: "p1", litresPerDay: 380, minBar: 1.5, sources: ["MAINS"], dispensing: "TANK", powered: false, createdAt: new Date() },
  images: [{ id: "i1", productId: "p1", imagePath: "a.webp", alt: null, sortOrder: 0, createdAt: new Date() }],
  contents: [],
  finishes: [],
  models3d: [],
};

describe("toSnapshot", () => {
  it("keeps content, id and sortOrder, and drops tenant and timestamps", () => {
    const s = toSnapshot("product", product);
    expect(s.id).toBe("p1");
    expect(s.sortOrder).toBe(3);
    expect(s.description).toBe("The under-sink system.");
    expect(s).not.toHaveProperty("tenantId");
    expect(s).not.toHaveProperty("updatedAt");
  });

  it("reduces child rows to the columns that recreate them", () => {
    const s = toSnapshot("product", product);
    expect(s.fit).toEqual({ litresPerDay: 380, minBar: 1.5, sources: ["MAINS"], dispensing: "TANK", powered: false });
    expect(s.images).toEqual([{ imagePath: "a.webp", alt: null, sortOrder: 0 }]);
  });

  it("remembers a category's products so an undelete can relink them", () => {
    const s = toSnapshot("category", { id: "c1", label: "Systems", slug: "systems", products: [{ id: "p1" }, { id: "p2" }] });
    expect(s.productIds).toEqual(["p1", "p2"]);
  });

  it("serialises dates the way the Json column stores them", () => {
    const s = toSnapshot("article", { id: "a1", titleEn: "RO", publishedAt: new Date("2026-09-04T00:00:00Z"), blocks: [] });
    expect(s.publishedAt).toBe("2026-09-04T00:00:00.000Z");
  });
});

describe("diffSnapshots", () => {
  it("lists only the fields that changed, including child rows", () => {
    const before = toSnapshot("product", product);
    const after = toSnapshot("product", {
      ...product,
      description: "The under-sink system. [dashboard test]",
      images: [...product.images, { id: "i2", productId: "p1", imagePath: "b.webp", alt: null, sortOrder: 1, createdAt: new Date() }],
    });
    expect(diffSnapshots("product", before, after).map((c) => c.field)).toEqual(["description", "images"]);
  });

  it("ignores key order, as jsonb reorders keys on the way back", () => {
    const fresh = { images: [{ imagePath: "a.webp", alt: null, sortOrder: 0 }] };
    const stored = { images: [{ sortOrder: 0, alt: null, imagePath: "a.webp" }] };
    expect(diffSnapshots("product", fresh, stored)).toEqual([]);
    expect(sameSnapshot(fresh, stored)).toBe(true);
  });

  it("treats a missing field and null as the same", () => {
    expect(diffSnapshots("category", { label: "A", description: null }, { label: "A" })).toEqual([]);
  });
});

describe("shouldCoalesce", () => {
  const now = new Date("2026-09-30T10:00:00Z");
  const recent = { userId: "u1", action: "child", createdAt: new Date(now.getTime() - 30_000) };

  it("folds a quick child edit by the same person into the last version", () => {
    expect(shouldCoalesce(recent, { userId: "u1", action: "child" }, now)).toBe(true);
  });
  it("keeps separate versions for another person, a main-form save, or after the window", () => {
    expect(shouldCoalesce(recent, { userId: "u2", action: "child" }, now)).toBe(false);
    expect(shouldCoalesce(recent, { userId: "u1", action: "update" }, now)).toBe(false);
    expect(shouldCoalesce({ ...recent, action: "update" }, { userId: "u1", action: "child" }, now)).toBe(false);
    const old = { ...recent, createdAt: new Date(now.getTime() - COALESCE_MS - 1) };
    expect(shouldCoalesce(old, { userId: "u1", action: "child" }, now)).toBe(false);
  });
  it("never coalesces the first version", () => {
    expect(shouldCoalesce(null, { userId: "u1", action: "child" }, now)).toBe(false);
  });
});

describe("liveVersion", () => {
  const published = new Date("2026-09-10T00:00:00Z");
  const item = { createdAt: new Date("2026-09-01T00:00:00Z"), updatedAt: new Date("2026-09-12T00:00:00Z") };
  const revs = [
    { id: "before-publish", createdAt: new Date("2026-09-05T00:00:00Z") },
    { id: "second-after", createdAt: new Date("2026-09-12T00:00:00Z") },
    { id: "first-after", createdAt: new Date("2026-09-11T00:00:00Z") },
  ];

  it("is the first version saved after the last publish", () => {
    expect(liveVersion(revs, item, published)).toEqual({ kind: "revision", id: "first-after" });
  });
  it("is the current state when nothing changed since publishing", () => {
    expect(liveVersion(revs, { ...item, updatedAt: published }, published)).toEqual({ kind: "current" });
  });
  it("is nothing when the site was never published or the item is newer than the publish", () => {
    expect(liveVersion(revs, item, null)).toEqual({ kind: "none" });
    expect(liveVersion([], { createdAt: new Date("2026-09-11T00:00:00Z"), updatedAt: new Date("2026-09-12T00:00:00Z") }, published)).toEqual({ kind: "none" });
  });
  it("is unknown when the change predates the history", () => {
    expect(liveVersion([revs[0]], item, published)).toEqual({ kind: "unknown" });
  });
});

describe("formatValue", () => {
  it("prints empties as a dash, lists joined, rows counted", () => {
    expect(formatValue(null)).toBe("—");
    expect(formatValue("")).toBe("—");
    expect(formatValue(["KITCHEN", "LAB"])).toBe("KITCHEN, LAB");
    expect(formatValue([{ a: 1 }, { a: 2 }])).toBe("2 items");
    expect(formatValue(false)).toBe("false");
  });
  it("truncates long text", () => {
    expect(formatValue("x".repeat(200), 10)).toBe("xxxxxxxxx…");
  });
});
