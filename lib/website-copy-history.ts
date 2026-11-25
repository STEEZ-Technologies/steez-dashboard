import { Prisma, type PrismaClient } from "@/app/generated/prisma/client";

type Scope = { tenantId: string; page: string; language: string };
type Actor = { id: string; email: string | null };
export type WebsiteCopyRow = { position: number; text: string; version: number };
export type WebsiteCopyEdit = { position: number; original: string; text: string; version: number };
export type WebsiteCopyState = { text: string | null; version: number };
export type WebsiteCopyRestore = {
  revisionId: string;
  position: number;
  expected: WebsiteCopyState;
};

class CopyConflict extends Error {}

async function transact(db: PrismaClient, work: (tx: Prisma.TransactionClient) => Promise<void>) {
  try {
    await db.$transaction(work);
    return "saved";
  } catch (error) {
    if (error instanceof CopyConflict ||
      (error instanceof Prisma.PrismaClientKnownRequestError && ["P2002", "P2034"].includes(error.code))) {
      return "conflict";
    }
    throw error;
  }
}

async function writeCopy(
  tx: Prisma.TransactionClient,
  field: Scope & { position: number },
  actor: Actor,
  expected: WebsiteCopyState,
  after: string | null,
  action: "update" | "remove" | "restore",
) {
  const version = expected.version + 1;
  if (expected.text === null) {
    // A removed field has no live row to compare. Its latest history entry
    // supplies the version. The live PK and history version are both unique.
    const latest = await tx.websiteCopyRevision.findFirst({
      where: field, orderBy: { version: "desc" }, select: { version: true, after: true },
    });
    if (!latest || latest.version !== expected.version || latest.after !== null || after === null) {
      throw new CopyConflict();
    }
    await tx.websiteCopy.create({ data: { ...field, text: after, version } });
  } else {
    const where = { ...field, version: expected.version, text: expected.text };
    if (expected.text === after) {
      if (!(await tx.websiteCopy.count({ where }))) throw new CopyConflict();
      return;
    }
    const changed = after === null
      ? await tx.websiteCopy.deleteMany({ where })
      : await tx.websiteCopy.updateMany({ where, data: { text: after, version } });
    if (changed.count !== 1) throw new CopyConflict();
  }
  await tx.websiteCopyRevision.create({
    data: { ...field, version, action, before: expected.text, after, userId: actor.id, userEmail: actor.email },
  });
}

export function saveWebsiteCopy(
  db: PrismaClient,
  scope: Scope,
  actor: Actor,
  edits: readonly { position: number; expected: WebsiteCopyState; after: string | null }[],
) {
  return transact(db, async tx => {
    // Always acquire field locks in the same order during a multi-field save.
    for (const { position, expected, after } of [...edits].sort((a, b) => a.position - b.position)) {
      await writeCopy(tx, { ...scope, position }, actor, expected, after, after === null ? "remove" : "update");
    }
  });
}

export function restoreWebsiteCopy(db: PrismaClient, scope: Scope, actor: Actor, restore: WebsiteCopyRestore) {
  return transact(db, async tx => {
    const field = { ...scope, position: restore.position };
    const revision = await tx.websiteCopyRevision.findFirst({
      where: { ...field, id: restore.revisionId }, select: { before: true },
    });
    if (revision?.before == null) throw new CopyConflict();
    await writeCopy(tx, field, actor, restore.expected, revision.before, "restore");
  });
}
