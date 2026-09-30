"use server";

import { revalidatePath } from "next/cache";
import { getTenantFromSession } from "@/lib/tenant";
import { logAudit } from "@/lib/audit";
import { prisma } from "@/lib/db";
import { getLiveVersion, restoreRevision, setUpdatedAt } from "@/lib/revisions";
import { isRevisionEntity } from "@/lib/revisions-core";

export type HistoryActionResult = { ok: true } | { ok: false; error: string };

async function restoreAndRecord(revisionId: string, verb: "restore" | "discard") {
  const result = await restoreRevision(revisionId);
  if (!result.ok) return result;
  await logAudit({
    action: `${result.entity}.${verb}`,
    entity: result.entity,
    entityId: result.entityId,
    detail: result.label,
  });
  // A restore can change a list page, an edit page, the publish banner and
  // Recently deleted at once — refresh the whole dashboard rather than guess.
  revalidatePath("/", "layout");
  return { ok: true } as const;
}

/** Put an item back to one of its saved versions. */
export async function restoreVersion(revisionId: string): Promise<HistoryActionResult> {
  return restoreAndRecord(revisionId, "restore");
}

/** Put an item back to the version currently on the live site. */
export async function discardChanges(entity: string, entityId: string): Promise<HistoryActionResult> {
  if (!isRevisionEntity(entity)) return { ok: false, error: "Unknown item type." };
  const { tenantId } = await getTenantFromSession();
  const live = await getLiveVersion(tenantId, entity, entityId);
  if (live.kind !== "revision") {
    return { ok: false, error: "There's no saved live version of this item to go back to." };
  }
  const result = await restoreAndRecord(live.id, "discard");
  if (result.ok) {
    // The item now matches the live site; stop counting it as a pending change.
    const { lastPublishedAt } = await prisma.tenant.findUniqueOrThrow({
      where: { id: tenantId },
      select: { lastPublishedAt: true },
    });
    if (lastPublishedAt) await setUpdatedAt(entity, entityId, tenantId, lastPublishedAt);
  }
  return result;
}
