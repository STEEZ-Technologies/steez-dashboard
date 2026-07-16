import { describe, it, expect } from "vitest";
import { toCsv, parseCsv, parseCsvToObjects } from "./csv";

describe("toCsv / parseCsv round-trip", () => {
  it("round-trips plain fields", () => {
    const rows = [
      ["slug", "name"],
      ["k1", "Simple Product"],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it("round-trips fields with commas, quotes, and newlines", () => {
    const rows = [
      ["slug", "description"],
      ["k1", 'Has, a comma and "quotes" and\na newline'],
    ];
    expect(parseCsv(toCsv(rows))).toEqual(rows);
  });

  it("round-trips a JSON specs blob (nested quotes)", () => {
    const specs = JSON.stringify({ Height: "1000mm", Note: 'Say "hi"' });
    const rows = [
      ["slug", "specs"],
      ["k1", specs],
    ];
    const out = parseCsv(toCsv(rows));
    expect(out[1][1]).toBe(specs);
    expect(JSON.parse(out[1][1])).toEqual({ Height: "1000mm", Note: 'Say "hi"' });
  });
});

describe("parseCsvToObjects", () => {
  it("keys rows by the header row", () => {
    const csv = "slug,name\nk1,Product One\nk2,Product Two";
    expect(parseCsvToObjects(csv)).toEqual([
      { slug: "k1", name: "Product One" },
      { slug: "k2", name: "Product Two" },
    ]);
  });

  it("returns an empty array for header-only or empty input", () => {
    expect(parseCsvToObjects("slug,name")).toEqual([]);
    expect(parseCsvToObjects("")).toEqual([]);
  });
});
