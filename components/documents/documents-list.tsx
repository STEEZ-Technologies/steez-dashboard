"use client";

import { useState, useTransition } from "react";
import { ArrowDown, ArrowUp, FileText, Pencil, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
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
  deleteDocument,
  deleteDocumentGroup,
  moveDocument,
  moveDocumentGroup,
} from "@/app/(dashboard)/resources/documents/actions";
import { useT } from "@/lib/i18n/provider";

export type DocumentRow = { id: string; label: string; url: string; published: boolean };
export type DocumentGroupRow = { id: string; title: string; documents: DocumentRow[] };

type Target = { kind: "group" | "doc"; id: string; name: string };

/** One section's groups, each a card listing its documents in order. */
export function DocumentsList({ groups }: { groups: DocumentGroupRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<Target | null>(null);
  const { dict } = useT();
  const t = dict.documents;
  const r = dict.resources;

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (groups.length === 0) {
    return <p className="rounded-xl border bg-card p-6 text-sm text-muted-foreground">{t.emptySection}</p>;
  }

  const moveButtons = (
    index: number,
    count: number,
    move: (direction: "up" | "down") => Promise<void>,
  ) => (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={index === 0 || pending}
        aria-label={dict.actions.moveUp}
        onClick={() => runAction(() => move("up"), r.toastMovedUp)}
      >
        <ArrowUp className="size-4" />
      </Button>
      <Button
        variant="ghost"
        size="icon-sm"
        disabled={index === count - 1 || pending}
        aria-label={dict.actions.moveDown}
        onClick={() => runAction(() => move("down"), r.toastMovedDown)}
      >
        <ArrowDown className="size-4" />
      </Button>
    </>
  );

  return (
    <div className="grid grid-cols-1 gap-4">
      {groups.map((g, gi) => (
        <div key={g.id} className="rounded-xl border bg-card">
          <div className="flex items-center gap-2 border-b px-4 py-3">
            <h3 className="min-w-0 flex-1 text-sm font-semibold">{g.title}</h3>
            <div className="flex shrink-0 items-center gap-1">
              {moveButtons(gi, groups.length, (d) => moveDocumentGroup(g.id, d))}
              <LinkButton
                variant="ghost"
                size="icon-sm"
                aria-label={dict.actions.edit}
                title={dict.actions.edit}
                href={`/resources/documents/groups/${g.id}/edit`}
              >
                <Pencil className="size-4" />
              </LinkButton>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={dict.actions.delete}
                title={dict.actions.delete}
                onClick={() => setToDelete({ kind: "group", id: g.id, name: g.title })}
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          </div>
          <ul className="divide-y">
            {g.documents.length === 0 && (
              <li className="px-4 py-3 text-sm text-muted-foreground">{t.emptyGroup}</li>
            )}
            {g.documents.map((d, di) => (
              <li key={d.id} className="flex items-center gap-2 px-4 py-2">
                <a
                  href={d.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex min-w-0 flex-1 items-center gap-2 text-sm hover:underline"
                  title={t.open}
                >
                  <FileText className="size-4 shrink-0 text-muted-foreground" />
                  <span className="truncate">{d.label}</span>
                </a>
                {!d.published && <Badge variant="outline">{r.draft}</Badge>}
                <div className="flex shrink-0 items-center gap-1">
                  {moveButtons(di, g.documents.length, (dir) => moveDocument(d.id, dir))}
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/resources/documents/${d.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.delete}
                    title={dict.actions.delete}
                    onClick={() => setToDelete({ kind: "doc", id: d.id, name: d.label })}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
          <div className="border-t px-4 py-2">
            <LinkButton variant="ghost" size="sm" href={`/resources/documents/new?group=${g.id}`}>
              <Plus /> {t.newDocument}
            </LinkButton>
          </div>
        </div>
      ))}

      <AlertDialog open={!!toDelete} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dict.actions.delete} &ldquo;{toDelete?.name ?? ""}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toDelete?.kind === "group" ? t.deleteGroupDesc : t.deleteDocDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (!target) return;
                runAction(
                  () => (target.kind === "group" ? deleteDocumentGroup(target.id) : deleteDocument(target.id)),
                  t.toastDeleted,
                );
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
