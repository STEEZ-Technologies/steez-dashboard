"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { Undo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
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
import { useT } from "@/lib/i18n/provider";
import { discardChanges } from "@/app/(dashboard)/history/actions";

/**
 * Puts one pending item back to the version on the live site. `state` says
 * whether that's possible: an item created since the last publish has no
 * live version, and one changed before history was kept has none saved.
 */
export function DiscardButton({
  entity,
  id,
  name,
  state,
}: {
  entity: string;
  id: string;
  name: string;
  state: "ready" | "new" | "unavailable";
}) {
  const { dict } = useT();
  const t = dict.history;
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (state !== "ready") {
    return (
      <p className="text-xs text-muted-foreground">
        {state === "new" ? t.discardNew : t.discardUnavailable}
      </p>
    );
  }

  return (
    <>
      <Button type="button" variant="outline" size="sm" disabled={pending} onClick={() => setOpen(true)}>
        <Undo2 data-icon="inline-start" />
        {t.discard}
      </Button>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.discardTitle.replace("{name}", name)}</AlertDialogTitle>
            <AlertDialogDescription>{t.discardDesc}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{dict.actions.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setOpen(false);
                startTransition(async () => {
                  const res = await discardChanges(entity, id);
                  if (res.ok) toast.success(t.discarded);
                  else toast.error(res.error);
                });
              }}
            >
              {t.discard}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
