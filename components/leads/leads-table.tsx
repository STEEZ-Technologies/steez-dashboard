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
  FileText,
  Trophy,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
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
  DropdownMenuLabel,
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
  updateLeadDeal,
  deleteLead,
} from "@/app/(dashboard)/leads/actions";
import { useT } from "@/lib/i18n/provider";
import { LeadJourneyView } from "@/components/leads/lead-journey";
import { CountryCode } from "@/components/shared/country-code";

type LeadStatus = "NEW" | "CONTACTED" | "QUOTED" | "WON" | "LOST" | "ARCHIVED";

// Pipeline order — drives the filter, the "Move to" menu and badge tones.
const STATUSES: LeadStatus[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST", "ARCHIVED"];
const STATUS_ICON: Record<LeadStatus, LucideIcon> = {
  NEW: Inbox,
  CONTACTED: CheckCircle2,
  QUOTED: FileText,
  WON: Trophy,
  LOST: XCircle,
  ARCHIVED: Archive,
};
const CURRENCIES = ["USD", "EUR", "CNY"] as const;

export type LeadRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  company: string | null;
  message: string | null;
  status: LeadStatus;
  notes: string | null;
  dealValue: number | null;
  dealCurrency: string | null;
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
  const [dealDrafts, setDealDrafts] = useState<
    Record<string, { value: string; currency: string }>
  >({});

  const statusLabel = (s: LeadStatus) =>
    ({
      NEW: t.statusNew,
      CONTACTED: t.statusContacted,
      QUOTED: t.statusQuoted,
      WON: t.statusWon,
      LOST: t.statusLost,
      ARCHIVED: t.statusArchived,
    })[s];

  const statusBadge = (s: LeadStatus) => (
    <Badge
      variant={
        s === "NEW" ? "default" : s === "LOST" || s === "ARCHIVED" ? "outline" : "secondary"
      }
      className={
        s === "WON"
          ? "bg-[color-mix(in_oklch,var(--chart-2)_18%,transparent)] text-[var(--chart-2)]"
          : undefined
      }
    >
      {statusLabel(s)}
    </Badge>
  );

  const dealDraft = (lead: LeadRow) =>
    dealDrafts[lead.id] ?? {
      value: lead.dealValue != null ? String(lead.dealValue) : "",
      currency: lead.dealCurrency ?? "USD",
    };

  function saveDeal(lead: LeadRow) {
    const d = dealDraft(lead);
    startTransition(async () => {
      const err = await updateLeadDeal(lead.id, d.value, d.currency);
      if (err) toast.error(err);
      else toast.success(t.dealSaved);
    });
  }

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

  // Opening a lead is how you "read" it — auto-clear it from the NEW badge
  // the same way an email client marks a message read on open, instead of
  // requiring a separate manual status change just to make the count honest.
  function toggleExpand(lead: LeadRow) {
    const opening = !expanded.has(lead.id);
    setExpanded((prev) => {
      const next = new Set(prev);
      if (opening) next.add(lead.id);
      else next.delete(lead.id);
      return next;
    });
    // Outside the updater: React may run updaters during render, where
    // starting a transition throws.
    if (opening && lead.status === "NEW") {
      startTransition(async () => {
        await updateLeadStatus(lead.id, "CONTACTED");
      });
    }
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
                : statusLabel(statusFilter as LeadStatus)}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">{t.allStatus}</SelectItem>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {statusLabel(s)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="rounded-xl border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[28px]" />
              <TableHead>{t.colContact}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.colProduct}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.colStatus}</TableHead>
              <TableHead className="hidden sm:table-cell">{t.colReceived}</TableHead>
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
                    <TableRow
                      data-pending={pending || undefined}
                      onClick={() => toggleExpand(lead)}
                      className="cursor-pointer"
                    >
                      <TableCell>
                        <button
                          type="button"
                          aria-label={isOpen ? "Collapse" : "Expand"}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(lead);
                          }}
                          className="flex size-6 items-center justify-center text-muted-foreground"
                        >
                          {isOpen ? (
                            <ChevronDown className="size-4" />
                          ) : (
                            <ChevronRight className="size-4" />
                          )}
                        </button>
                      </TableCell>
                      <TableCell className="whitespace-normal">
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
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex min-w-0 items-center gap-1 break-all hover:text-foreground"
                            >
                              <Mail className="size-3" />
                              {lead.email}
                            </a>
                          )}
                          {lead.phone && (
                            <a
                              href={`tel:${lead.phone}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 hover:text-foreground"
                            >
                              <Phone className="size-3" />
                              {lead.phone}
                            </a>
                          )}
                          {lead.country && <CountryCode code={lead.country} />}
                        </div>
                        {/* Product, status and time, which have their own columns from sm up. */}
                        <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground sm:hidden">
                          {statusBadge(lead.status)}
                          <span>{lead.productId ? lead.productName : t.noProduct}</span>
                          <span>{relativeTime(lead.createdAt)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="hidden sm:table-cell text-muted-foreground" onClick={(e) => e.stopPropagation()}>
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
                      <TableCell className="hidden sm:table-cell">
                        {statusBadge(lead.status)}
                      </TableCell>
                      <TableCell className="hidden sm:table-cell whitespace-nowrap text-muted-foreground">
                        {relativeTime(lead.createdAt)}
                      </TableCell>
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <DropdownMenu>
                          <DropdownMenuTrigger
                            render={
                              <Button variant="ghost" size="icon-sm" aria-label="Actions" />
                            }
                          >
                            <MoreHorizontal className="size-4" />
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>{t.moveTo}</DropdownMenuLabel>
                            {STATUSES.filter((s) => s !== lead.status).map((s) => {
                              const Icon = STATUS_ICON[s];
                              return (
                                <DropdownMenuItem key={s} onClick={() => setStatus(lead, s)}>
                                  <Icon className="size-4" /> {statusLabel(s)}
                                </DropdownMenuItem>
                              );
                            })}
                            {lead.productId && <DropdownMenuSeparator />}
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
                              <div className="mt-5">
                                <LeadJourneyView leadId={lead.id} />
                              </div>
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

                              <p className="eyebrow mb-1.5 mt-5">{t.deal}</p>
                              <div className="flex max-w-sm items-center gap-2">
                                <Select
                                  value={dealDraft(lead).currency}
                                  onValueChange={(v) =>
                                    setDealDrafts((d) => ({
                                      ...d,
                                      [lead.id]: { ...dealDraft(lead), currency: v ?? "USD" },
                                    }))
                                  }
                                >
                                  <SelectTrigger className="w-[88px] shrink-0">
                                    <span>{dealDraft(lead).currency}</span>
                                  </SelectTrigger>
                                  <SelectContent>
                                    {CURRENCIES.map((c) => (
                                      <SelectItem key={c} value={c}>
                                        {c}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                                <Input
                                  inputMode="decimal"
                                  aria-label={t.deal}
                                  placeholder={t.dealPlaceholder}
                                  value={dealDraft(lead).value}
                                  onChange={(e) =>
                                    setDealDrafts((d) => ({
                                      ...d,
                                      [lead.id]: { ...dealDraft(lead), value: e.target.value },
                                    }))
                                  }
                                  className="min-w-0 tabular-nums"
                                />
                                <Button
                                  size="sm"
                                  variant="secondary"
                                  disabled={pending}
                                  onClick={() => saveDeal(lead)}
                                >
                                  {t.saveDeal}
                                </Button>
                              </div>
                              <p className="mt-1.5 whitespace-normal text-xs text-muted-foreground">{t.dealHelp}</p>
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
