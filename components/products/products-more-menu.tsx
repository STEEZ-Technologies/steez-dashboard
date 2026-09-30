"use client";

import { useState } from "react";
import Link from "next/link";
import { Download, FolderTree, MoreHorizontal, Upload } from "lucide-react";
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

/**
 * The Products page's secondary actions behind one "More" button, so "New
 * product" is the only button competing for attention. Categories live here
 * too since they left the sidebar.
 */
export function ProductsMoreMenu() {
  const { dict } = useT();
  const [importOpen, setImportOpen] = useState(false);

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
