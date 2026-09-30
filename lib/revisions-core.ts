// Pure half of the version history (lib/revisions.ts holds the database
// half). Kept free of Prisma and "server-only" so vitest can exercise the
// rules that decide what a snapshot holds, what changed between two of them,
// and which one is the version currently on the live site.

export const REVISION_ENTITIES = ["product", "article", "guide", "category"] as const;
export type RevisionEntity = (typeof REVISION_ENTITIES)[number];

// What was *about to happen* when the snapshot was taken. "child" is an edit
// to a sub-row (a block, a gallery image, a finish) rather than the main form.
export type RevisionAction = "update" | "delete" | "restore" | "child";

export type Snapshot = Record<string, unknown>;

// Quick successive child edits by one person collapse into one version, or
// reordering ten blocks would bury the history under ten near-identical rows.
export const COALESCE_MS = 2 * 60 * 1000;
export const KEEP_PER_ITEM = 50;
export const DELETED_WINDOW_DAYS = 30;

export function isRevisionEntity(v: string): v is RevisionEntity {
  return (REVISION_ENTITIES as readonly string[]).includes(v);
}

// The content fields a restore writes back. Listed explicitly rather than
// "every column except…" so a column added to the schema later is never
// overwritten by an old snapshot that predates it. sortOrder is deliberately
// absent: reordering isn't versioned, so restoring text must not also move
// the item in its list.
export const FIELDS: Record<RevisionEntity, readonly string[]> = {
  product: [
    "name", "nameZh", "model", "slug", "description", "descriptionZh",
    "categoryId", "kind", "useCases", "specs", "imagePath", "imageAlt",
    "featured", "published", "seoTitle", "seoDescription", "seoKeywords",
    "canonicalUrl", "ogImagePath", "noindex",
  ],
  article: [
    "titleEn", "titleZh", "slug", "standfirstEn", "standfirstZh",
    "metaTitleEn", "metaTitleZh", "keywordsEn", "keywordsZh", "topic",
    "imagePath", "imageAltEn", "imageAltZh", "published", "publishedAt",
  ],
  guide: [
    "titleEn", "titleZh", "slug", "reader", "standfirstEn", "standfirstZh",
    "minutes", "imagePath", "imageAltEn", "imageAltZh",
    "imageDistributorPath", "imageDistributorAltEn", "imageDistributorAltZh",
    "imageCustomerPath", "imageCustomerAltEn", "imageCustomerAltZh", "published",
  ],
  category: [
    "label", "slug", "description", "seoTitle", "seoDescription",
    "seoKeywords", "ogImagePath", "noindex",
  ],
};

// Child rows, each reduced to the columns that recreate it. Ids, parent ids
// and timestamps are dropped: a restore deletes the current children and
// creates these afresh.
export const CHILD_FIELDS: Record<string, readonly string[]> = {
  fit: ["litresPerDay", "minBar", "sources", "dispensing", "powered"],
  images: ["imagePath", "alt", "sortOrder"],
  contents: ["textEn", "textZh", "sortOrder"],
  finishes: ["key", "materialLabel", "imagePath", "accentHex", "sortOrder"],
  models3d: ["modelPath", "sortOrder"],
  blocks: ["kind", "textEn", "textZh", "itemsEn", "itemsZh", "sortOrder"],
};

export const CHILDREN: Record<RevisionEntity, readonly string[]> = {
  product: ["fit", "images", "contents", "finishes", "models3d"],
  article: ["blocks"],
  guide: ["blocks"],
  category: [],
};

function pick(row: Record<string, unknown>, keys: readonly string[]) {
  const out: Record<string, unknown> = {};
  for (const k of keys) if (k in row) out[k] = row[k] ?? null;
  return out;
}

// Dates become ISO strings, the same as they would after a round trip
// through the Json column, so a fresh snapshot and a stored one compare equal.
function plain(v: unknown): unknown {
  return v === undefined ? null : JSON.parse(JSON.stringify(v));
}

/**
 * Reduce a database row (loaded with its children) to what a version holds.
 * `id` and `sortOrder` ride along so a deleted item can be recreated in
 * place; categories also keep the ids of their products, because deleting a
 * category nulls those links and an undelete should put them back.
 */
export function toSnapshot(entity: RevisionEntity, row: Record<string, unknown>): Snapshot {
  const snap: Snapshot = { id: row.id, sortOrder: row.sortOrder ?? 0, ...pick(row, FIELDS[entity]) };
  for (const key of CHILDREN[entity]) {
    const value = row[key];
    if (key === "fit") {
      snap.fit = value ? pick(value as Record<string, unknown>, CHILD_FIELDS.fit) : null;
    } else {
      snap[key] = ((value as Record<string, unknown>[] | undefined) ?? []).map((c) =>
        pick(c, CHILD_FIELDS[key]),
      );
    }
  }
  if (entity === "category") {
    snap.productIds = ((row.products as { id: string }[] | undefined) ?? []).map((p) => p.id);
  }
  return plain(snap) as Snapshot;
}

// Postgres jsonb stores object keys in its own order, so a snapshot read
// back from the database and one built fresh from a row can hold the same
// data with keys shuffled. Compare with keys sorted, never raw JSON.stringify.
export function stableStringify(v: unknown): string {
  if (v === undefined) return "null";
  if (v === null || typeof v !== "object") return JSON.stringify(v);
  if (Array.isArray(v)) return `[${v.map(stableStringify).join(",")}]`;
  const o = v as Record<string, unknown>;
  return `{${Object.keys(o)
    .sort()
    .map((k) => `${JSON.stringify(k)}:${stableStringify(o[k])}`)
    .join(",")}}`;
}

export function sameSnapshot(a: unknown, b: unknown) {
  return stableStringify(a) === stableStringify(b);
}

export type FieldChange = { field: string; before: unknown; after: unknown };

/** Fields whose value differs between two snapshots, in form order. */
export function diffSnapshots(
  entity: RevisionEntity,
  before: Snapshot,
  after: Snapshot,
): FieldChange[] {
  const changes: FieldChange[] = [];
  for (const field of [...FIELDS[entity], ...CHILDREN[entity]]) {
    const a = before[field] ?? null;
    const b = after[field] ?? null;
    if (!sameSnapshot(a, b)) changes.push({ field, before: a, after: b });
  }
  return changes;
}

type RevLike = { userId: string | null; action: string; createdAt: Date };

/** True when a new child-edit version should fold into the one just taken. */
export function shouldCoalesce(
  last: RevLike | null,
  next: { userId: string | null; action: RevisionAction },
  now: Date,
) {
  if (!last || next.action !== "child" || last.action !== "child") return false;
  if (last.userId !== next.userId) return false;
  return now.getTime() - last.createdAt.getTime() < COALESCE_MS;
}

export type LiveVersion =
  | { kind: "none" } // never published, or the item didn't exist at the last publish
  | { kind: "current" } // unchanged since the last publish
  | { kind: "revision"; id: string } // this saved version is what the site shows
  | { kind: "unknown" }; // changed since publish, but before history was recorded

/**
 * Which version the live site shows. Snapshots are taken *before* each
 * change, so the first one after the last publish holds the published state.
 * `revisions` may be in any order.
 */
export function liveVersion(
  revisions: { id: string; createdAt: Date }[],
  item: { createdAt: Date; updatedAt: Date },
  lastPublishedAt: Date | null,
): LiveVersion {
  if (!lastPublishedAt || item.createdAt > lastPublishedAt) return { kind: "none" };
  if (item.updatedAt <= lastPublishedAt) return { kind: "current" };
  const first = revisions
    .filter((r) => r.createdAt > lastPublishedAt)
    .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime())[0];
  return first ? { kind: "revision", id: first.id } : { kind: "unknown" };
}

/** One line of text for a field value in the "what changed" list. */
export function formatValue(v: unknown, max = 140): string {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "string") return v.length > max ? v.slice(0, max - 1) + "…" : v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "—";
    if (v.every((x) => typeof x === "string")) return formatValue(v.join(", "), max);
    return `${v.length} ${v.length === 1 ? "item" : "items"}`;
  }
  return formatValue(JSON.stringify(v), max);
}
