import { describe, it, expect } from "vitest";
import { productCompleteness, type CompletenessInput } from "./completeness";

const full: CompletenessInput = {
  nameZh: "隐藏式水箱",
  description: "Concealed cistern",
  descriptionZh: "隐藏式水箱",
  imagePath: "products/k6602.jpg",
  galleryCount: 0,
  categoryId: "cat1",
  specs: { Material: "ABS" },
};

describe("productCompleteness", () => {
  it("scores a finished product 6/6 with nothing missing", () => {
    expect(productCompleteness(full)).toEqual({ done: 6, total: 6, missing: [] });
  });

  it("treats blank strings and empty specs as missing", () => {
    const r = productCompleteness({ ...full, nameZh: "  ", specs: { Material: "" } });
    expect(r.done).toBe(4);
    expect(r.missing.map((m) => m.key)).toEqual(["nameZh", "specs"]);
  });

  it("points each gap at the tab that fixes it", () => {
    const r = productCompleteness({ ...full, specs: null, categoryId: null });
    expect(r.missing).toEqual([
      { key: "category", tab: "basics" },
      { key: "specs", tab: "specs" },
    ]);
  });

  it("accepts a gallery image as the photo on a normal tenant", () => {
    const r = productCompleteness({ ...full, imagePath: null, galleryCount: 2 });
    expect(r.missing).toEqual([]);
  });

  it("requires a gallery image on a lean tenant and sends them to Media", () => {
    const r = productCompleteness({ ...full, galleryCount: 0 }, { lean: true });
    expect(r.missing).toEqual([{ key: "photo", tab: "media" }]);
  });
});
