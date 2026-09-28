"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  addProductContent,
  updateProductContent,
  removeProductContent,
  moveProductContent,
} from "@/app/(dashboard)/products/[id]/content/actions";

export type ProductContentRow = {
  id: string;
  textEn: string;
  textZh: string | null;
};

export function ProductContent({
  productId,
  items,
}: {
  productId: string;
  items: ProductContentRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [newEn, setNewEn] = useState("");
  const [newZh, setNewZh] = useState("");

  function runAction(fn: () => Promise<void>, message?: string) {
    startTransition(async () => {
      await fn();
      if (message) toast.success(message);
    });
  }

  function handleAdd() {
    if (!newEn.trim()) return;
    runAction(() => addProductContent(productId, { textEn: newEn, textZh: newZh }), "Item added");
    setNewEn("");
    setNewZh("");
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">
          No box contents listed yet — e.g. "1x membrane housing", "2x mounting brackets".
        </p>
      ) : (
        <ul className="mb-4 grid gap-3">
          {items.map((item, index) => (
            <ProductContentItem
              key={item.id}
              item={item}
              disableUp={index === 0 || pending}
              disableDown={index === items.length - 1 || pending}
              onMoveUp={() => runAction(() => moveProductContent(productId, item.id, "up"))}
              onMoveDown={() => runAction(() => moveProductContent(productId, item.id, "down"))}
              onRemove={() =>
                runAction(() => removeProductContent(productId, item.id), "Item removed")
              }
              onSave={(data) => runAction(() => updateProductContent(productId, item.id, data))}
            />
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
        <div className="grid gap-1.5">
          <Label htmlFor="newContentEn">Item (English)</Label>
          <Input
            id="newContentEn"
            value={newEn}
            onChange={(e) => setNewEn(e.target.value)}
            placeholder="1x membrane housing"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="newContentZh">Item (Chinese)</Label>
          <Input id="newContentZh" value={newZh} onChange={(e) => setNewZh(e.target.value)} />
        </div>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleAdd}>
          <Plus /> Add item
        </Button>
      </div>
    </div>
  );
}

function ProductContentItem({
  item,
  disableUp,
  disableDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSave,
}: {
  item: ProductContentRow;
  disableUp: boolean;
  disableDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onSave: (data: { textEn: string; textZh?: string }) => void;
}) {
  const [textEn, setTextEn] = useState(item.textEn);
  const [textZh, setTextZh] = useState(item.textZh ?? "");

  return (
    <li className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_1fr_auto] sm:items-center">
      <Input
        value={textEn}
        onChange={(e) => setTextEn(e.target.value)}
        onBlur={() => onSave({ textEn, textZh })}
      />
      <Input
        value={textZh}
        onChange={(e) => setTextZh(e.target.value)}
        onBlur={() => onSave({ textEn, textZh })}
      />
      <div className="flex items-center gap-1 justify-self-end">
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disableUp}
          aria-label="Move up"
          onClick={onMoveUp}
        >
          <ArrowUp className="size-4" />
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          disabled={disableDown}
          aria-label="Move down"
          onClick={onMoveDown}
        >
          <ArrowDown className="size-4" />
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Delete" onClick={onRemove}>
          <Trash2 className="size-4 text-destructive" />
        </Button>
      </div>
    </li>
  );
}
