import { describe, it, expect } from "vitest";
import { parseSpecsText, formatSpecsText } from "./specs";

describe("parseSpecsText", () => {
  it("parses key: value lines into a map", () => {
    expect(parseSpecsText("Height: 1000mm\nWidth: 500mm")).toEqual({
      Height: "1000mm",
      Width: "500mm",
    });
  });

  it("trims whitespace and skips blank / separator-less lines", () => {
    expect(parseSpecsText("  Depth : 20mm \n\nno-separator\n")).toEqual({
      Depth: "20mm",
    });
  });

  it("keeps only the first colon as separator", () => {
    expect(parseSpecsText("Ratio: 16:9")).toEqual({ Ratio: "16:9" });
  });

  it("drops entries with empty key or value", () => {
    expect(parseSpecsText(": novalue\nKey:")).toEqual({});
  });

  it("returns an empty object for empty input", () => {
    expect(parseSpecsText("")).toEqual({});
  });
});

describe("formatSpecsText", () => {
  it("formats a map back into key: value lines", () => {
    expect(formatSpecsText({ Height: "1000mm", Width: "500mm" })).toBe(
      "Height: 1000mm\nWidth: 500mm",
    );
  });

  it("returns empty string for nullish / non-object input", () => {
    expect(formatSpecsText(null)).toBe("");
    expect(formatSpecsText(undefined)).toBe("");
    expect(formatSpecsText("nope")).toBe("");
  });
});

describe("specs round-trip", () => {
  it("parse ∘ format is stable", () => {
    const text = "Height: 1000mm\nMaterial: ABS";
    expect(formatSpecsText(parseSpecsText(text))).toBe(text);
  });
});
