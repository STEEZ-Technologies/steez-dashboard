"use client";

import { useTransition } from "react";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { exitWorkspace } from "@/app/(dashboard)/admin/actions";
import { useT } from "@/lib/i18n/provider";

/**
 * Shown on every page while a STEEZ operator is inside a client workspace,
 * so edits are never made in a client's catalog by accident.
 */
export function ActingBanner({ tenantName }: { tenantName: string }) {
  const { dict } = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap items-center gap-x-3 gap-y-2 border-b bg-[var(--chart-2)]/15 px-4 py-2 text-sm">
      <p className="min-w-0 flex-1">
        {dict.admin.actingBanner.replace("{name}", tenantName)}
      </p>
      <Button
        variant="outline"
        size="sm"
        disabled={pending}
        onClick={() => startTransition(() => exitWorkspace())}
      >
        <LogOut className="size-3.5" />
        {dict.admin.exitWorkspace}
      </Button>
    </div>
  );
}
