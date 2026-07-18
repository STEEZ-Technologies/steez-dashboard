"use client";

import { Fragment, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import {
  ChevronDown,
  ChevronRight,
  Mail,
  Phone,
  MoreHorizontal,
  Trash2,
  CheckCircle2,
  Archive,
  Inbox,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  updateLeadStatus,
  updateLeadNotes,
  deleteLead,
} from "@/app/(dashboard)/leads/actions";
import { useT } from "@/lib/i18n/provider";

export type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: "NEW" | "CONTACTED" | "ARCHIVED";
  notes: string | null;
  country: string | null;
  productId: string | null;
  productName: string | null;
  productModel: string | null;
  createdAt: string; // ISO — formatted client-side
};

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

export function LeadsTable({ leads }: { leads: LeadRow[] }) {
  const { dict } = useT();
  const t = dict.leads;
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [toDelete, setToDelete] = useState<LeadRow | null>(null);
  const [noteDrafts, setNoteDrafts] = useState<Record<string, string>>({});

  const statusLabel = (s: LeadRow["status"]) =>
    s === "NEW" ? t.statusNew : s === "CONTACTED" ? t.statusContacted : t.statusArchived;

  const visible = useMemo(
    () => (statusFilter === "ALL" ? leads : leads.filter((l) => l.status === statusFilter)),
    [leads, statusFilter],
  );

  function setStatus(lead: LeadRow, status: LeadRow["status"]) {
    startTransition(async () => {
      const err = await updateLeadStatus(lead.id, status);
      if (err) toast.error(err);
      else toast.success(t.statusUpdated);
    });
  }

  function saveNotes(lead: LeadRow) {
    const value = noteDrafts[lead.id] ?? lead.notes ?? "";
    startTransition(async () => {
      const err = await updateLeadNotes(lead.id, value);
      if (err) toast.error(err);
      else toast.success(t.notesSaved);
    });
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v ?? "ALL")}>
          <SelectTrigger className="w-[200px]">
            {/* Render the label explicitly — SelectValue echoes the raw value. */}
            <span>
              {statusFilter === "ALL"
                ? t.allStatus
                : statusLabel(statusFilter as LeadRow["status"])}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.allStatus}</SelectItem>
            <SelectItem value="NEW">{t.statusNew}</SelectItem>
            <SelectItem value="CONTACTED">{t.statusContacted}</SelectItem>
            <SelectItem value="ARCHIVED">{t.statusArchived}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28px]" />
              <TableHead>{t.colContact}</TableHead>
              <TableHead>{t.colProduct}</TableHead>
              <TableHead>{t.colStatus}</TableHead>
              <TableHead>{t.colReceived}</TableHead>
              <TableHead className="w-[52px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {visible.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                  {t.noMatch}
                </TableCell>
              </TableRow>
            ) : (
              visible.map((lead) => {
                const isOpen = expanded.has(lead.id);
                return (
                  <Fragment key={lead.id}>
                    <TableRow data-pending={pending || undefined}>
                      <TableCell>
                        <button
                          type="button"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          onClick={() =>
                            setExpanded((prev) => {
                              const next = new Set(prev);
                              if (next.has(lead.id)) next.delete(lead.id);
                              else next.add(lead.id);
                              return next;
                            })
                          }
                          className="flex size-6 items-center justify-center text-muted-foreground"
                        >
                          {isOpen ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {lead.name ?? lead.email ?? lead.phone}
                          {lead.status === "NEW" && (
                            <span className="ml-2 inline-block size-1.5 rounded-full bg-[var(--chart-2)] align-middle" />
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-x-3 text-xs text-muted-foreground">
                          {lead.company && <span>{lead.company}</span>}
                          {lead.email && (
                            <a
                              href={`mailto:${lead.email}`}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <Mail className="size-3" />
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <Phone className="size-3" />
                              {lead.phone}
                            </a>
                          )}
                          {lead.country && <span>{lead.country}</span>}
                        </div>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {lead.productId ? (
                          <Link
                            href={`/products/${lead.productId}/edit`}
                            className="hover:underline"
                          >
                            {lead.productName}
                            <span className="ml-1 text-xs">{lead.productModel}</span>
                          </Link>
                        ) : (
                          <span className="text-xs">{t.noProduct}</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            lead.status === "NEW"
                              ? "default"
                              : lead.status === "CONTACTED"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {statusLabel(lead.status)}
                        </Badge>
                      </TableCell>
                      <TableCell className="whitespace-nowrap text-muted-foreground">
                        {relativeTime(lead.createdAt)}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            {lead.status !== "CONTACTED" && (
                              <DropdownMenuItem onClick={() => setStatus(lead, "CONTACTED")}>
                                <CheckCircle2 className="size-4" /> {t.markContacted}
                              </DropdownMenuItem>
                            )}
                            {lead.status !== "NEW" && (
                              <DropdownMenuItem onClick={() => setStatus(lead, "NEW")}>
                                <Inbox className="size-4" /> {t.markNew}
                              </DropdownMenuItem>
                            )}
                            {lead.status !== "ARCHIVED" && (
                              <DropdownMenuItem onClick={() => setStatus(lead, "ARCHIVED")}>
                                <Archive className="size-4" /> {t.archive}
                              </DropdownMenuItem>
                            )}
                            {lead.productId && (
                              <DropdownMenuItem
                                render={
                                  <Link href={`/products/${lead.productId}/analytics`} />
                                }
                              >
                                <BarChart3 className="size-4" /> {dict.actions.analytics}
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setToDelete(lead)}
                            >
                              <Trash2 className="size-4" /> {dict.actions.delete}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                    {isOpen && (
                      <TableRow>
                        <TableCell colSpan={6} className="bg-muted/30">
                          <div className="grid gap-4 px-2 py-1 lg:grid-cols-2">
                            <div>
                              <p className="eyebrow mb-1.5">{t.message}</p>
                              <p className="whitespace-pre-wrap text-sm">
                                {lead.message || "—"}
                              </p>
                            </div>
                            <div>
                              <p className="eyebrow mb-1.5">{t.notes}</p>
                              <Textarea
                                rows={3}
                                placeholder={t.notesPlaceholder}
                                defaultValue={lead.notes ?? ""}
                                onChange={(e) =>
                                  setNoteDrafts((d) => ({ ...d, [lead.id]: e.target.value }))
                                }
                              />
                              <Button
                                size="sm"
                                variant="secondary"
                                className="mt-2"
                                disabled={pending}
                                onClick={() => saveNotes(lead)}
                              >
                                {t.saveNotes}
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dict.products.deleteTitle} “{toDelete?.name ?? toDelete?.email}”?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (!target) return;
                startTransition(async () => {
                  const err = await deleteLead(target.id);
                  if (err) toast.error(err);
                  else toast.success(t.deleted);
                });
              }}
            >
              {dict.actions.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
