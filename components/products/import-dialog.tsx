"use client";

import { useRef, useState, useTransition } from "react";
import { Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { parseCsvToObjects } from "@/lib/csv";
import {
  importProductsCsv,
  type ImportRow,
  type ImportSummary,
} from "@/app/(dashboard)/products/import/actions";
import { useT } from "@/lib/i18n/provider";

export function ImportDialog({ importLabel }: { importLabel: string }) {
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<ImportRow[] | null>(null);
  const [fileName, setFileName] = useState("");
  const [summary, setSummary] = useState<ImportSummary | null>(null);
  const [pending, startTransition] = useTransition();
  const inputRef = useRef<HTMLInputElement>(null);
  const { dict } = useT();

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setSummary(null);
    const text = await file.text();
    const parsed = parseCsvToObjects(text) as unknown as ImportRow[];
    setRows(parsed);
  }

  function handleImport() {
    if (!rows) return;
    startTransition(async () => {
      const result = await importProductsCsv(rows);
      setSummary(result);
      if (result.errors.length === 0) {
        toast.success(
          dict.import.resultSummary
            .replace("{created}", String(result.created))
            .replace("{updated}", String(result.updated)),
        );
      }
    });
  }

  function reset() {
    setRows(null);
    setFileName("");
    setSummary(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        setOpen(o);
        if (!o) reset();
      }}
    >
      <DialogTrigger render={<Button variant="outline" size="sm" />}>
        <Upload /> {importLabel}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{importLabel}</DialogTitle>
          <DialogDescription>
            {dict.import.description}
          </DialogDescription>
        </DialogHeader>

        <input
          ref={inputRef}
          type="file"
          accept=".csv,text/csv"
          onChange={handleFile}
          className="block w-full text-sm"
        />

        {rows && !summary && (
          <p className="text-sm text-muted-foreground">
            {dict.import.rowsReady
              .replace("{file}", fileName)
              .replace("{count}", String(rows.length))}
          </p>
        )}

        {summary && (
          <div className="rounded-md border p-3 text-sm">
            <p>
              {dict.import.resultSummary
                .replace("{created}", String(summary.created))
                .replace("{updated}", String(summary.updated))}
              {summary.errors.length > 0 &&
                dict.import.resultSkipped.replace("{count}", String(summary.errors.length))}
            </p>
            {summary.errors.length > 0 && (
              <ul className="mt-2 max-h-32 space-y-1 overflow-y-auto text-xs text-destructive">
                {summary.errors.map((e, i) => (
                  <li key={i}>
                    {dict.import.rowError
                      .replace("{row}", String(e.row))
                      .replace("{reason}", e.reason)}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            {dict.import.close}
          </Button>
          <Button
            onClick={handleImport}
            disabled={!rows || pending || !!summary}
          >
            {pending ? <Loader2 className="size-4 animate-spin" /> : <Upload />}
            {pending ? dict.import.importing : dict.import.import}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
