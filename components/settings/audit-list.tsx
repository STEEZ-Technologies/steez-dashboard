import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

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

export function AuditList({ items }: { items: AuditItem[] }) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No activity recorded yet.</p>
    );
  }
  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Action</TableHead>
            <TableHead>Detail</TableHead>
            <TableHead>By</TableHead>
            <TableHead>When</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((a) => (
            <TableRow key={a.id}>
              <TableCell className="font-mono text-xs">{a.action}</TableCell>
              <TableCell className="max-w-[220px] truncate text-muted-foreground">
                {a.detail ?? "—"}
              </TableCell>
              <TableCell className="text-muted-foreground">{a.userEmail ?? "—"}</TableCell>
              <TableCell className="text-muted-foreground">{fmt(a.createdAt)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
