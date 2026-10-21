import { describe, expect, it } from "vitest";
import { ALL_TOPICS, topicForPath } from "./manual";

describe("topicForPath", () => {
  it("picks the most specific topic for a route", () => {
    expect(topicForPath("/")?.id).toBe("overview");
    expect(topicForPath("/products")?.id).toBe("products");
    expect(topicForPath("/products/abc123/edit")?.id).toBe("products");
    expect(topicForPath("/products/abc123/analytics")?.id).toBe("analytics");
    expect(topicForPath("/resources/documents/groups/new")?.id).toBe("documents");
    expect(topicForPath("/resources/videos/new")?.id).toBe("resources");
    expect(topicForPath("/company/offices/x/edit")?.id).toBe("company");
    expect(topicForPath("/settings/")?.id).toBe("settings");
  });

  it("is null for a page the manual doesn't cover", () => {
    expect(topicForPath("/admin")).toBeNull();
  });
});

describe("manual", () => {
  it("has unique topic ids and both languages everywhere", () => {
    const ids = ALL_TOPICS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
    const texts = ALL_TOPICS.flatMap((t) => [
      t.title,
      t.summary,
      ...t.sections.flatMap((s) => [s.heading, ...(s.body ?? []), ...(s.steps ?? []), ...(s.note ? [s.note.text] : [])]),
    ]);
    for (const x of texts) {
      expect(x.en.trim()).not.toBe("");
      expect(x.zh.trim()).not.toBe("");
    }
  });
});
