"use client";

import { useState, useTransition } from "react";
import { BookOpen, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { EmptyState } from "@/components/shell/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { deleteGuide, moveGuide } from "@/app/(dashboard)/resources/actions";
import { useT } from "@/lib/i18n/provider";

export type GuideRow = {
  id: string;
  titleEn: string;
  reader: "DISTRIBUTOR" | "CUSTOMER" | "BOTH";
  published: boolean;
};

export function ResourcesTable({ guides }: { guides: GuideRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<GuideRow | null>(null);
  const { dict } = useT();
  const t = dict.resources;

  const readerLabel: Record<GuideRow["reader"], string> = {
    DISTRIBUTOR: t.readerDistributor,
    CUSTOMER: t.readerCustomer,
    BOTH: t.readerBoth,
  };

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (guides.length === 0) {
    return (
      <EmptyState
        icon={BookOpen}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          <LinkButton href="/resources/new">
            <Plus /> {dict.actions.newGuide}
          </LinkButton>
        }
      />
    );
  }

  return (
    <div className="rounded-xl border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>{t.colGuide}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colReader}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colStatus}</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {guides.map((g, index) => (
            <TableRow key={g.id}>
              <TableCell className="whitespace-normal font-medium">
                {g.titleEn}
                {/* Status, which has its own column from sm up. */}
                <div className="mt-1 sm:hidden">
                  <Badge variant={g.published ? "default" : "outline"}>
                  {g.published ? t.published : t.draft}
                </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">{readerLabel[g.reader]}</TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={g.published ? "default" : "outline"}>
                  {g.published ? t.published : t.draft}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0 || pending}
                    aria-label={dict.actions.moveUp}
                    onClick={() => runAction(() => moveGuide(g.id, "up"), t.toastMovedUp)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === guides.length - 1 || pending}
                    aria-label={dict.actions.moveDown}
                    onClick={() => runAction(() => moveGuide(g.id, "down"), t.toastMovedDown)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/resources/${g.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.delete}
                    title={dict.actions.delete}
                    onClick={() => setToDelete(g)}
                  >
                    <Trash2 className="size-4 text-destructive" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <AlertDialog open={!!toDelete} onOpenChange={(o) => !o && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {dict.actions.delete} &ldquo;{toDelete?.titleEn}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(() => deleteGuide(target.id), t.toastDeleted);
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
