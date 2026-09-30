import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import type { Dictionary } from "@/lib/i18n/dictionaries/en";

export type AuditItem = {
  id: string;
  action: string;
  entity: string;
  userEmail: string | null;
  detail: string | null;
  createdAt: Date;
};

function fmt(d: Date) {
  return d.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function AuditList({ items, dict }: { items: AuditItem[]; dict: Dictionary }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">{dict.settings.noActivity}</p>
    );
  }
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{dict.settings.colAction}</TableHead>
            <TableHead className="hidden sm:table-cell">{dict.settings.colDetail}</TableHead>
            <TableHead className="hidden sm:table-cell">{dict.settings.colBy}</TableHead>
            <TableHead>{dict.settings.colWhen}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="whitespace-normal">
                <span className="font-mono text-xs">{a.action}</span>
                {/* Detail and who, which have their own columns from sm up. */}
                <p className="mt-0.5 line-clamp-2 break-all text-xs text-muted-foreground sm:hidden">
                  {a.detail ?? "—"} · {a.userEmail ?? "—"}
                </p>
              </TableCell>
              <TableCell className="hidden sm:table-cell max-w-[220px] truncate text-muted-foreground">
                {a.detail ?? "—"}
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">{a.userEmail ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{fmt(a.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
