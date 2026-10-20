import { describe, expect, it } from "vitest";
import { productI18nFromForm, readProductI18n, readTextI18n } from "./product-i18n";

describe("readTextI18n", () => {
  it("keeps the four extra languages' non-blank strings, trimmed", () => {
    expect(readTextI18n({ fr: " Domestique ", it: "", es: "Doméstico", ja: 3, de: "x" })).toEqual({
      fr: "Domestique",
      es: "Doméstico",
    });
  });
  it("reads anything that isn't an object as nothing", () => {
    expect(readTextI18n(null)).toEqual({});
    expect(readTextI18n(["fr"])).toEqual({});
  });
});

describe("readProductI18n", () => {
  it("drops a language whose name and description are both blank", () => {
    expect(
      readProductI18n({ fr: { name: "KB-C100R", description: "" }, it: { name: " " }, es: "x" }),
    ).toEqual({ fr: { name: "KB-C100R" } });
  });
});

describe("productI18nFromForm", () => {
  it("collects name_xx and description_xx", () => {
    const fd = new FormData();
    fd.set("name_es", "KB-C100R");
    fd.set("description_es", "1000 GPD de flujo directo.");
    fd.set("description_ja", "");
    expect(productI18nFromForm(fd)).toEqual({
      es: { name: "KB-C100R", description: "1000 GPD de flujo directo." },
    });
  });
});
