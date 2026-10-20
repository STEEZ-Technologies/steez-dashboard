import { describe, expect, it } from "vitest";
import { homeContentFromForm, readStats } from "./home-content";

function form(overrides: Record<string, string> = {}) {
  const fd = new FormData();
  fd.set("heroTitle_en", "The filter you never think about");
  fd.set("heroTitle_zh", "装好就不用操心的净水器");
  fd.set("heroSub_en", "Under-sink reverse osmosis.");
  for (let i = 0; i < 4; i++) {
    fd.set(`stat${i}_figure_en`, String(i));
    fd.set(`stat${i}_unit_en`, i === 0 ? "W" : "");
    fd.set(`stat${i}_label_en`, `Label ${i}`);
    fd.set(`stat${i}_body_en`, "");
    fd.set(`stat${i}_href`, "/information/");
  }
  for (const [k, v] of Object.entries(overrides)) fd.set(k, v);
  return fd;
}

describe("homeContentFromForm", () => {
  it("reads the claim and four figures", () => {
    const r = homeContentFromForm(form({ stat3_figure_zh: "近 30" }));
    if (!("data" in r)) throw new Error("expected data");
    expect(r.data.heroTitle).toEqual({ en: "The filter you never think about", zh: "装好就不用操心的净水器" });
    expect(r.data.stats).toHaveLength(4);
    expect(r.data.stats[0]).toEqual({
      figure: { en: "0" },
      unit: { en: "W" },
      label: { en: "Label 0" },
      body: null,
      href: "/information/",
    });
    expect(r.data.stats[3].figure).toEqual({ en: "3", zh: "近 30" });
  });

  it("needs English for the claim, each figure and each label", () => {
    expect(homeContentFromForm(form({ heroTitle_en: "" }))).toEqual({ error: "title" });
    expect(homeContentFromForm(form({ heroSub_en: " " }))).toEqual({ error: "sub" });
    expect(homeContentFromForm(form({ stat2_figure_en: "" }))).toEqual({ error: "figure", stat: 2 });
    expect(homeContentFromForm(form({ stat1_label_en: "" }))).toEqual({ error: "label", stat: 1 });
  });

  it("takes a site page or a full URL as the link, and / when blank", () => {
    expect(homeContentFromForm(form({ stat0_href: "javascript:alert(1)" }))).toEqual({ error: "href", stat: 0 });
    const r = homeContentFromForm(form({ stat0_href: "", stat1_href: "https://example.com/x" }));
    if (!("data" in r)) throw new Error("expected data");
    expect(r.data.stats[0].href).toBe("/");
    expect(r.data.stats[1].href).toBe("https://example.com/x");
  });
});

describe("readStats", () => {
  it("drops entries without a figure or label", () => {
    expect(readStats([{ figure: { en: "1" }, label: { en: "x" }, href: "/a/" }, { figure: { en: "2" } }, null])).toEqual([
      { figure: { en: "1" }, unit: null, label: { en: "x" }, body: null, href: "/a/" },
    ]);
    expect(readStats(null)).toEqual([]);
  });
});
