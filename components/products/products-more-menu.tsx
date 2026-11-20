"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Download, FolderTree, Loader2, MoreHorizontal, RefreshCw, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ImportDialog } from "@/components/products/import-dialog";
import { useT } from "@/lib/i18n/provider";
import { importKawadaSite } from "@/app/(dashboard)/products/import-kawada/actions";

/**
 * The Products page's secondary actions behind one "More" button, so "New
 * product" is the only button competing for attention. Categories live here
 * too since they left the sidebar.
 */
export function ProductsMoreMenu({ canImportKawada = false }: { canImportKawada?: boolean }) {
  const { dict } = useT();
  const [importOpen, setImportOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleKawadaImport() {
    startTransition(async () => {
      try {
        const result = await importKawadaSite();
        const total = result.categories + result.products + result.primaryImages + result.galleries + result.events + result.articles + result.documents + result.homepage;
        toast.success(total ? `Kawada import complete: ${total} items added or linked` : "Kawada content is up to date");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Kawada import failed");
      }
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="icon" aria-label={dict.actions.more} />}
        >
          <MoreHorizontal className="size-4" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuItem render={<Link href="/categories" />}>
            <FolderTree className="size-4" /> {dict.nav.categories}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem render={<a href="/api/products/export" />}>
            <Download className="size-4" /> {dict.actions.export}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => setImportOpen(true)}>
            <Upload className="size-4" /> {dict.actions.import}
          </DropdownMenuItem>
          {canImportKawada && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem disabled={pending} onClick={handleKawadaImport}>
                {pending ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
                Import Kawada website
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <ImportDialog
        importLabel={dict.actions.import}
        open={importOpen}
        onOpenChange={setImportOpen}
      />
    </>
  );
}
