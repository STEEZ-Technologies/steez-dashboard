"use client";

import { useState, useTransition } from "react";
import { Clapperboard, ExternalLink, Pencil, Trash2, ArrowUp, ArrowDown, Plus } from "lucide-react";
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
import { deleteVideo, moveVideo } from "@/app/(dashboard)/resources/videos/actions";
import { useT } from "@/lib/i18n/provider";

export type VideoKindValue = "PRESS" | "DISTRIBUTOR" | "TRAINING" | "PRODUCT";

export type VideoRow = {
  id: string;
  titleEn: string;
  titleZh: string | null;
  kind: VideoKindValue;
  short: boolean;
  url: string;
  published: boolean;
};

// No thumbnails here on purpose: they come from i.ytimg.com, which is Google
// and doesn't load in mainland China, where the client's staff work.
export function VideosTable({ videos }: { videos: VideoRow[] }) {
  const [pending, startTransition] = useTransition();
  const [toDelete, setToDelete] = useState<VideoRow | null>(null);
  const { dict, locale } = useT();
  const t = dict.videos;
  const r = dict.resources;

  const kindLabel: Record<VideoKindValue, string> = {
    PRESS: t.kindPress,
    DISTRIBUTOR: t.kindDistributor,
    TRAINING: t.kindTraining,
    PRODUCT: t.kindProduct,
  };
  const titleOf = (v: VideoRow) => (locale === "zh" && v.titleZh ? v.titleZh : v.titleEn);

  function runAction(fn: () => Promise<void>, message: string) {
    startTransition(async () => {
      await fn();
      toast.success(message);
    });
  }

  if (videos.length === 0) {
    return (
      <EmptyState
        icon={Clapperboard}
        title={t.emptyTitle}
        description={t.emptyDesc}
        action={
          <LinkButton href="/resources/videos/new">
            <Plus /> {dict.actions.newVideo}
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
            <TableHead>{t.colVideo}</TableHead>
            <TableHead className="hidden sm:table-cell">{t.colKind}</TableHead>
            <TableHead className="hidden sm:table-cell">{r.colStatus}</TableHead>
            <TableHead className="w-[150px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {videos.map((v, index) => (
            <TableRow key={v.id}>
              <TableCell className="whitespace-normal font-medium">
                {titleOf(v)}
                {/* Type and status, which have their own columns from sm up. */}
                <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-normal text-muted-foreground sm:hidden">
                  <span>{kindLabel[v.kind]}</span>
                  {v.short && <Badge variant="secondary">{t.short}</Badge>}
                  {!v.published && <Badge variant="outline">{r.draft}</Badge>}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell text-muted-foreground">
                <div className="flex flex-wrap items-center gap-2">
                  {kindLabel[v.kind]}
                  {v.short && <Badge variant="secondary">{t.short}</Badge>}
                </div>
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Badge variant={v.published ? "default" : "outline"}>
                  {v.published ? r.published : r.draft}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-end gap-1">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === 0 || pending}
                    aria-label={dict.actions.moveUp}
                    onClick={() => runAction(() => moveVideo(v.id, "up"), r.toastMovedUp)}
                  >
                    <ArrowUp className="size-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    disabled={index === videos.length - 1 || pending}
                    aria-label={dict.actions.moveDown}
                    onClick={() => runAction(() => moveVideo(v.id, "down"), r.toastMovedDown)}
                  >
                    <ArrowDown className="size-4" />
                  </Button>
                  <a
                    href={v.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={t.open}
                    title={t.open}
                    className="inline-flex size-7 items-center justify-center rounded-md hover:bg-muted"
                  >
                    <ExternalLink className="size-4" />
                  </a>
                  <LinkButton
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.edit}
                    title={dict.actions.edit}
                    href={`/resources/videos/${v.id}/edit`}
                  >
                    <Pencil className="size-4" />
                  </LinkButton>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label={dict.actions.delete}
                    title={dict.actions.delete}
                    onClick={() => setToDelete(v)}
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
              {dict.actions.delete} &ldquo;{toDelete ? titleOf(toDelete) : ""}&rdquo;?
            </AlertDialogTitle>
            <AlertDialogDescription>{t.deleteDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                const target = toDelete;
                setToDelete(null);
                if (target) runAction(() => deleteVideo(target.id), t.toastDeleted);
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
