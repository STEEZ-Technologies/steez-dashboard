"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Plus, Trash2 } from "lucide-react";
import { parseSpecsText, formatSpecsText } from "@/lib/specs";

type Row = { key: string; value: string };

function rowsFromText(text: string): Row[] {
  const specs = parseSpecsText(text);
  const rows = Object.entries(specs).map(([key, value]) => ({ key, value }));
  return rows.length > 0 ? rows : [{ key: "", value: "" }];
}

/**
 * Row-by-row editor for Product.specs — replaces a "type Key: Value per
 * line" textbox with a plain add/remove list. Still serializes to the same
 * specsText hidden field the server action already parses (lib/specs.ts),
 * so no server-side change was needed for this.
 */
export function SpecRows({ initialText }: { initialText?: string }) {
  const [rows, setRows] = useState<Row[]>(() => rowsFromText(initialText ?? ""));

  const update = (i: number, patch: Partial<Row>) =>
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  const remove = (i: number) =>
    setRows((prev) => (prev.length > 1 ? prev.filter((_, idx) => idx !== i) : prev));
  const add = () => setRows((prev) => [...prev, { key: "", value: "" }]);

  const specsText = formatSpecsText(
    Object.fromEntries(rows.filter((r) => r.key.trim()).map((r) => [r.key, r.value])),
  );

  return (
    <div className="grid gap-2">
      <Label>Specifications</Label>
      <p className="text-xs text-muted-foreground">
        What&apos;s shown on the product page, e.g. Height and 1000mm.
      </p>
      <input type="hidden" name="specsText" value={specsText} />
      <div className="grid gap-2">
        {rows.map((row, i) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              aria-label="Specification name"
              placeholder="Height"
              value={row.key}
              onChange={(e) => update(i, { key: e.target.value })}
              className="flex-1"
            />
            <Input
              aria-label="Specification value"
              placeholder="1000mm"
              value={row.value}
              onChange={(e) => update(i, { value: e.target.value })}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="Remove"
              onClick={() => remove(i)}
              disabled={rows.length === 1}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
      </div>
      <div>
        <Button type="button" variant="outline" size="sm" onClick={add}>
          <Plus className="size-4" /> Add specification
        </Button>
      </div>
    </div>
  );
}
