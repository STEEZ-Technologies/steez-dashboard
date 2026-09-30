import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { getDictionary } from "@/lib/i18n";
import { currentSnapshot, getHistory, getLiveVersion } from "@/lib/revisions";
import {
  diffSnapshots,
  fieldLabel,
  formatValue,
  type RevisionEntity,
  type Snapshot,
} from "@/lib/revisions-core";
import { HistoryList, type HistoryRow } from "@/components/shared/history-list";

/**
 * Past versions of one catalogue item, newest first, each with what
 * restoring it would change and a Restore button. Sits at the foot of the
 * item's edit page.
 */
export async function HistoryCard({ entity, id }: { entity: RevisionEntity; id: string }) {
  const { tenantId } = await getTenantFromSession();
  const [dict, now, revisions, live] = await Promise.all([
    getDictionary(),
    currentSnapshot(tenantId, entity, id),
    getHistory(tenantId, entity, id),
    getLiveVersion(tenantId, entity, id),
  ]);
  if (!now) return null;

  // A product's category is stored as an id; show its name instead.
  const categories =
    entity === "product"
      ? new Map(
          (await prisma.category.findMany({ where: { tenantId }, select: { id: true, label: true } })).map(
            (c) => [c.id, c.label],
          ),
        )
      : null;
  const show = (field: string, v: unknown) =>
    field === "categoryId" && categories && typeof v === "string"
      ? (categories.get(v) ?? "(deleted category)")
      : formatValue(v);

  const rows: HistoryRow[] = revisions.map((r) => ({
    id: r.id,
    action: r.action,
    who: r.userEmail,
    createdAt: r.createdAt.toISOString(),
    live: live.kind === "revision" && live.id === r.id,
    changes: diffSnapshots(entity, now, r.snapshot as Snapshot).map((c) => ({
      field: c.field,
      label: fieldLabel(c.field),
      now: show(c.field, c.before),
      then: show(c.field, c.after),
    })),
  }));

  return (
    <Card className="mt-6 max-w-2xl">
      <CardHeader>
        <CardTitle>{dict.history.title}</CardTitle>
        <CardDescription>{dict.history.desc}</CardDescription>
      </CardHeader>
      <CardContent>
        <HistoryList
          rows={rows}
          currentIsLive={live.kind === "current"}
          liveUnknown={live.kind === "unknown"}
        />
      </CardContent>
    </Card>
  );
}
