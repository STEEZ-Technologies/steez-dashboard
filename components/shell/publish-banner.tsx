"use client";

import { useTransition } from "react";
import Link from "next/link";
import { CloudUpload, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { publishToLive } from "@/app/(dashboard)/actions";
import { useT } from "@/lib/i18n/provider";

/**
 * Shown wherever catalog edits happen. Without this, a client edits a product,
 * sees no change on their live static site, and assumes the tool is broken.
 */
export function PublishBanner({
  pendingCount,
  configured,
  canPublish,
}: {
  pendingCount: number;
  configured: boolean;
  canPublish: boolean;
}) {
  const { dict } = useT();
  const t = dict.publish;
  const [pending, startTransition] = useTransition();

  if (pendingCount === 0) return null;

  function publish() {
    startTransition(async () => {
      const err = await publishToLive();
      if (err === "NOT_CONFIGURED") toast.error(t.notConfigured);
      else if (err) toast.error(err);
      else toast.success(t.published);
    });
  }

  return (
    <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-[var(--gold)]/40 bg-[var(--gold)]/10 px-4 py-3">
      <TriangleAlert className="size-4 shrink-0 text-[var(--gold)]" />
      <p className="text-sm">
        <span className="font-semibold tabular-nums">{pendingCount}</span>{" "}
        {pendingCount === 1 ? t.pendingOne : t.pendingOther}
      </p>
      <div className="ml-auto flex items-center gap-2">
        {configured ? (
          canPublish ? (
            <Button size="sm" onClick={publish} disabled={pending}>
              <CloudUpload className="size-4" />
              {pending ? t.publishing : t.publishNow}
            </Button>
          ) : null
        ) : (
          <Link href="/settings" className="text-sm font-medium underline">
            {t.notConfigured}
          </Link>
        )}
      </div>
    </div>
  );
}
