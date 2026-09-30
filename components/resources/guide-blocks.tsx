"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus, Table2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Bilingual } from "@/components/shared/language-tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  addGuideBlock,
  updateGuideBlock,
  removeGuideBlock,
  moveGuideBlock,
} from "@/app/(dashboard)/resources/[id]/blocks/actions";
import { useT } from "@/lib/i18n/provider";

export type GuideBlockKind = "P" | "H" | "LIST" | "TABLE";

export type GuideBlockRow = {
  id: string;
  kind: GuideBlockKind;
  textEn: string | null;
  textZh: string | null;
  itemsEn: string[] | null;
  itemsZh: string[] | null;
};

export function GuideBlocks({
  guideId,
  blocks,
}: {
  guideId: string;
  blocks: GuideBlockRow[];
}) {
  const [pending, startTransition] = useTransition();
  const [newKind, setNewKind] = useState<GuideBlockKind>("P");
  const { dict } = useT();
  const t = dict.resources;

  const kindLabel: Record<GuideBlockKind, string> = {
    P: t.blockParagraph,
    H: t.blockHeading,
    LIST: t.blockList,
    TABLE: t.blockTable,
  };

  function runAction(fn: () => Promise<void>, message?: string) {
    startTransition(async () => {
      await fn();
      if (message) toast.success(message);
    });
  }

  function handleAdd() {
    runAction(
      () => addGuideBlock(guideId, { kind: newKind }),
      t.blockSaved,
    );
  }

  return (
    <div>
      {blocks.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">{t.blocksEmpty}</p>
      ) : (
        <ul className="mb-4 grid gap-3">
          {blocks.map((block, index) => (
            <GuideBlockItem
              key={block.id}
              guideId={guideId}
              block={block}
              kindLabel={kindLabel[block.kind]}
              disableUp={index === 0 || pending}
              disableDown={index === blocks.length - 1 || pending}
              onMoveUp={() => runAction(() => moveGuideBlock(guideId, block.id, "up"))}
              onMoveDown={() => runAction(() => moveGuideBlock(guideId, block.id, "down"))}
              onRemove={() =>
                runAction(() => removeGuideBlock(guideId, block.id), t.blockRemoved)
              }
              onSave={(data) =>
                runAction(() => updateGuideBlock(guideId, block.id, data), t.blockSaved)
              }
            />
          ))}
        </ul>
      )}

      <div className="flex items-center gap-2">
        <Select
          value={newKind}
          onValueChange={(v) => v && setNewKind(v as GuideBlockKind)}
          items={kindLabel}
        >
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="P">{t.blockParagraph}</SelectItem>
            <SelectItem value="H">{t.blockHeading}</SelectItem>
            <SelectItem value="LIST">{t.blockList}</SelectItem>
            <SelectItem value="TABLE">{t.blockTable}</SelectItem>
          </SelectContent>
        </Select>
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleAdd}>
          <Plus /> {t.addBlock}
        </Button>
      </div>
    </div>
  );
}

function GuideBlockItem({
  block,
  kindLabel,
  disableUp,
  disableDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSave,
}: {
  guideId: string;
  block: GuideBlockRow;
  kindLabel: string;
  disableUp: boolean;
  disableDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onSave: (data: {
    textEn?: string;
    textZh?: string;
    itemsEnText?: string;
    itemsZhText?: string;
  }) => void;
}) {
  const { dict } = useT();
  const t = dict.resources;
  const [textEn, setTextEn] = useState(block.textEn ?? "");
  const [textZh, setTextZh] = useState(block.textZh ?? "");
  const [itemsEnText, setItemsEnText] = useState((block.itemsEn ?? []).join("\n"));
  const [itemsZhText, setItemsZhText] = useState((block.itemsZh ?? []).join("\n"));

  return (
    <li className="rounded-lg border p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {block.kind === "TABLE" && <Table2 className="size-3.5" />}
          {kindLabel}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disableUp}
            aria-label={dict.actions.moveUp}
            onClick={onMoveUp}
          >
            <ArrowUp className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            disabled={disableDown}
            aria-label={dict.actions.moveDown}
            onClick={onMoveDown}
          >
            <ArrowDown className="size-4" />
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            aria-label={dict.actions.delete}
            onClick={onRemove}
          >
            <Trash2 className="size-4 text-destructive" />
          </Button>
        </div>
      </div>

      {block.kind === "TABLE" && (
        <p className="text-sm text-muted-foreground">{t.blockTablePlaceholder}</p>
      )}

      {(block.kind === "P" || block.kind === "H") && (
        <Bilingual
          en={
            <>
              <Label>{t.blockTextEn}</Label>
              {block.kind === "H" ? (
                <Input
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  onBlur={() => onSave({ textEn, textZh })}
                />
              ) : (
                <Textarea
                  rows={3}
                  value={textEn}
                  onChange={(e) => setTextEn(e.target.value)}
                  onBlur={() => onSave({ textEn, textZh })}
                />
              )}
            </>
          }
          zh={
            <>
              <Label>{t.blockTextZh}</Label>
              {block.kind === "H" ? (
                <Input
                  value={textZh}
                  onChange={(e) => setTextZh(e.target.value)}
                  onBlur={() => onSave({ textEn, textZh })}
                />
              ) : (
                <Textarea
                  rows={3}
                  value={textZh}
                  onChange={(e) => setTextZh(e.target.value)}
                  onBlur={() => onSave({ textEn, textZh })}
                />
              )}
            </>
          }
        />
      )}

      {block.kind === "LIST" && (
        <Bilingual
          en={
            <>
              <Label>{t.blockItemsEn}</Label>
              <Textarea
                rows={4}
                value={itemsEnText}
                onChange={(e) => setItemsEnText(e.target.value)}
                onBlur={() => onSave({ itemsEnText, itemsZhText })}
              />
            </>
          }
          zh={
            <>
              <Label>{t.blockItemsZh}</Label>
              <Textarea
                rows={4}
                value={itemsZhText}
                onChange={(e) => setItemsZhText(e.target.value)}
                onBlur={() => onSave({ itemsEnText, itemsZhText })}
              />
            </>
          }
        />
      )}
    </li>
  );
}
