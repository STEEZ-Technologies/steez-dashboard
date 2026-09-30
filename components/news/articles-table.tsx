"use client";

import { useState, useTransition } from "react";
import { Newspaper, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
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
import { deleteArticle, moveArticle } from "@/app/(dashboard)/news/actions";
import { useT } from "@/lib/i18n/provider";

export type ArticleTopicValue =
  | "REVERSE_OSMOSIS"
  | "CHOOSING"
  | "MAINTENANCE"
  | "WATER_QUALITY"
  | "SUSTAINABILITY"
  | "COMPANY";

export type ArticleRow = {
  id: string;
  titleEn: string;
  topic: ArticleTopicValue;
  published: boolean;
};

export function ArticlesTable({ articles }: { articles: ArticleRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<ArticleRow | null>(null);
  const { dict } = useT();
  const t = dict.news;

  const topicLabel: Record<ArticleTopicValue, string> = {
    REVERSE_OSMOSIS: t.topicReverseOsmosis,
    CHOOSING: t.topicChoosing,
    MAINTENANCE: t.topicMaintenance,
    WATER_QUALITY: t.topicWaterQuality,
    SUSTAINABILITY: t.topicSustainability,
    COMPANY: t.topicCompany,
  };

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (articles.length === 0) {
    return (
      <EmptyState
        icon={Newspaper}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          <LinkButton href="/news/new">
            <Plus /> {dict.actions.newArticle}
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
            <TableHead>{t.colArticle}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colTopic}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colStatus}</TableHead>
            <TableHead className="w-[120px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {articles.map((a, index) => (
            <TableRow key={a.id}>
              <TableCell className="whitespace-normal font-medium">
                {a.titleEn}
                {/* Status, which has its own column from sm up. */}
                <div className="mt-1 sm:hidden">
                  <Badge variant={a.published ? "default" : "outline"}>
                  {a.published ? t.published : t.draft}
                </Badge>
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                {topicLabel[a.topic]}
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={a.published ? "default" : "outline"}>
                  {a.published ? t.published : t.draft}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0 || pending}
                    aria-label={dict.actions.moveUp}
                    onClick={() => runAction(() => moveArticle(a.id, "up"), t.toastMovedUp)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === articles.length - 1 || pending}
                    aria-label={dict.actions.moveDown}
                    onClick={() => runAction(() => moveArticle(a.id, "down"), t.toastMovedDown)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/news/${a.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.delete}
                    title={dict.actions.delete}
                    onClick={() => setToDelete(a)}
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
                if (target) runAction(() => deleteArticle(target.id), t.toastDeleted);
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
