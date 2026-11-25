import { describe, expect, it } from "vitest";
import type { PrismaClient } from "@/app/generated/prisma/client";
import { restoreWebsiteCopy, saveWebsiteCopy, type WebsiteCopyState } from "./website-copy-history";

const scope = { tenantId: "kawada-test", page: "home", language: "en" };
const actor = { id: "editor", email: "editor@example.test" };
type Field = typeof scope & { position: number };
type Live = Field & { version: number; text: string };
type Revision = Field & {
  id: string;
  version: number;
  before: string | null;
  after: string | null;
  action: string;
};
const key = ({ tenantId, page, language, position }: Field) => [tenantId, page, language, position].join("/");

function fixture(failHistoryAt?: number) {
  const heading = { ...scope, position: 90, text: "Heading", version: 0 };
  const intro = { ...scope, position: 2, text: "Intro", version: 0 };
  const spanish = { ...heading, language: "es", text: "Título" };
  let rows = new Map([heading, intro, spanish].map(row => [key(row), row]));
  let revisions: Revision[] = [];

  const db = {
    async $transaction(work: (tx: unknown) => Promise<void>) {
      const nextRows = new Map(rows);
      const nextRevisions = [...revisions];
      function matches(where: Live) {
        const row = nextRows.get(key(where));
        return row?.text === where.text && row?.version === where.version;
      }

      await work({
        websiteCopy: {
          async count({ where }: { where: Live }) { return Number(matches(where)); },
          async updateMany({ where, data }: { where: Live; data: Live }) {
            if (!matches(where)) return { count: 0 };
            nextRows.set(key(where), { ...nextRows.get(key(where))!, ...data });
            return { count: 1 };
          },
          async deleteMany({ where }: { where: Live }) {
            if (!matches(where)) return { count: 0 };
            nextRows.delete(key(where));
            return { count: 1 };
          },
          async create({ data }: { data: Live }) {
            if (nextRows.has(key(data))) throw new Error("Duplicate field");
            nextRows.set(key(data), data);
          },
        },
        websiteCopyRevision: {
          async findFirst({ where }: { where: Field & { id?: string } }) {
            return nextRevisions.filter(row => key(row) === key(where) && (!where.id || row.id === where.id))
              .sort((a, b) => b.version - a.version)[0];
          },
          async create({ data }: { data: Omit<Revision, "id"> }) {
            if (data.position === failHistoryAt) throw new Error("History write failed");
            nextRevisions.push({ ...data, id: String(nextRevisions.length + 1) });
          },
        },
      });
      rows = nextRows;
      revisions = nextRevisions;
    },
  } as unknown as PrismaClient;

  return {
    db, heading, intro, spanish,
    row: (position: number, language = scope.language) => rows.get(key({ ...scope, position, language })),
    revisions: () => revisions,
  };
}

function edit(position: number, expected: WebsiteCopyState, after: string | null) {
  return { position, expected, after };
}

describe("website text history", () => {
  it("rolls back an entire visual save when the later field conflicts", async () => {
    const { db, heading, intro, row, revisions } = fixture();
    expect(await saveWebsiteCopy(db, scope, actor, [edit(90, heading, "Newer")])).toBe("saved");
    expect(await saveWebsiteCopy(db, scope, actor, [edit(2, intro, "Changed"), edit(90, heading, "Stale")])).toBe("conflict");
    expect(row(2)).toEqual(intro);
    expect(row(90)?.text).toBe("Newer");
    expect(revisions()).toHaveLength(1);
  });

  it("rolls back text and earlier history writes if a history insert fails", async () => {
    const { db, heading, intro, row, revisions } = fixture(90);
    await expect(saveWebsiteCopy(db, scope, actor, [edit(2, intro, "Changed"), edit(90, heading, "Changed")]))
      .rejects.toThrow("History write failed");
    expect(row(2)).toEqual(intro);
    expect(row(90)).toEqual(heading);
    expect(revisions()).toEqual([]);
  });

  it("restores removed text in its original slot and language and records the restoration", async () => {
    const { db, heading, spanish, row, revisions } = fixture();
    expect(await saveWebsiteCopy(db, scope, actor, [edit(90, heading, null)])).toBe("saved");
    expect(row(90)).toBeUndefined();
    const removal = revisions()[0];
    const restore = { position: 90, revisionId: removal.id, expected: { text: null, version: removal.version } };
    expect(await restoreWebsiteCopy(db, { ...scope, language: "es" }, actor, restore)).toBe("conflict");
    expect(await restoreWebsiteCopy(db, scope, actor, restore)).toBe("saved");
    expect(row(90)).toEqual({ ...heading, version: 2 });
    expect(row(90, "es")).toEqual(spanish);
    expect(revisions().at(-1)).toMatchObject({ action: "restore", before: null, after: heading.text, ...scope, position: 90 });
    expect(await restoreWebsiteCopy(db, scope, actor, restore)).toBe("conflict");
    expect(revisions()).toHaveLength(2);
  });

  it("rejects stale saves and restores after the wording changes and changes back", async () => {
    const { db, heading, row, revisions } = fixture();
    await saveWebsiteCopy(db, scope, actor, [edit(90, heading, "Different")]);
    const old = row(90)!;
    const revisionId = revisions()[0].id;
    await saveWebsiteCopy(db, scope, actor, [edit(90, old, "Another")]);
    await saveWebsiteCopy(db, scope, actor, [edit(90, row(90)!, old.text)]);
    expect(await saveWebsiteCopy(db, scope, actor, [edit(90, old, "Stale save")])).toBe("conflict");
    expect(await restoreWebsiteCopy(db, scope, actor, { position: 90, revisionId, expected: old })).toBe("conflict");
    expect(row(90)?.text).toBe("Different");
    expect(revisions()).toHaveLength(3);
  });
});
