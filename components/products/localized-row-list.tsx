"use client";

import { useState, useTransition } from "react";
import { ArrowUp, ArrowDown, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Multilingual, useEditsLanguage } from "@/components/shared/language-tabs";
import { EXTRA_LANGS, type ExtraLang, type TextI18n } from "@/lib/product-i18n";

/* An ordered list of short lines, one per row, in every language the page
 * edits — what a product's box contents and its extra "Suited to" labels both
 * are. Each row saves on blur; the four extra languages are only rendered,
 * and only sent, on a page that edits them, so a save elsewhere never touches
 * them. */

export type LocalizedRow = {
  id: string;
  textEn: string;
  textZh: string | null;
  textI18n: TextI18n;
};

export type LocalizedRowInput = { textEn: string; textZh?: string; textI18n?: TextI18n };

const LANG_NAMES: Record<ExtraLang, string> = {
  fr: "French",
  it: "Italian",
  es: "Spanish",
  ja: "Japanese",
};

export function LocalizedRowList({
  items,
  idPrefix,
  noun,
  placeholder,
  emptyText,
  onAdd,
  onUpdate,
  onRemove,
  onMove,
}: {
  items: LocalizedRow[];
  idPrefix: string;
  /** "Item", "Label" — used in field labels and buttons. */
  noun: string;
  placeholder: string;
  emptyText: React.ReactNode;
  onAdd: (data: LocalizedRowInput) => Promise<void>;
  onUpdate: (id: string, data: LocalizedRowInput) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
  onMove: (id: string, direction: "up" | "down") => Promise<void>;
}) {
  const [pending, startTransition] = useTransition();
  const editsExtra = useEditsLanguage("fr");
  const [newEn, setNewEn] = useState("");
  const [newZh, setNewZh] = useState("");
  const [newExtra, setNewExtra] = useState<TextI18n>({});

  function runAction(fn: () => Promise<void>, message?: string) {
    startTransition(async () => {
      await fn();
      if (message) toast.success(message);
    });
  }

  function handleAdd() {
    if (!newEn.trim()) return;
    runAction(
      () => onAdd({ textEn: newEn, textZh: newZh, ...(editsExtra && { textI18n: newExtra }) }),
      `${noun} added`,
    );
    setNewEn("");
    setNewZh("");
    setNewExtra({});
  }

  return (
    <div>
      {items.length === 0 ? (
        <p className="mb-4 text-sm text-muted-foreground">{emptyText}</p>
      ) : (
        <ul className="mb-4 grid gap-3">
          {items.map((item, index) => (
            <LocalizedRowItem
              key={item.id}
              item={item}
              noun={noun}
              editsExtra={editsExtra}
              disableUp={index === 0 || pending}
              disableDown={index === items.length - 1 || pending}
              onMoveUp={() => runAction(() => onMove(item.id, "up"))}
              onMoveDown={() => runAction(() => onMove(item.id, "down"))}
              onRemove={() => runAction(() => onRemove(item.id), `${noun} removed`)}
              onSave={(data) => runAction(() => onUpdate(item.id, data))}
            />
          ))}
        </ul>
      )}

      <div className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-end">
        <Multilingual
          fields={{
            en: (
              <>
                <Label htmlFor={`${idPrefix}NewEn`}>{noun} (English)</Label>
                <Input
                  id={`${idPrefix}NewEn`}
                  value={newEn}
                  onChange={(e) => setNewEn(e.target.value)}
                  placeholder={placeholder}
                />
              </>
            ),
            zh: (
              <>
                <Label htmlFor={`${idPrefix}NewZh`}>{noun} (Chinese)</Label>
                <Input id={`${idPrefix}NewZh`} value={newZh} onChange={(e) => setNewZh(e.target.value)} />
              </>
            ),
            ...(editsExtra
              ? Object.fromEntries(
                  EXTRA_LANGS.map((l) => [
                    l,
                    <>
                      <Label htmlFor={`${idPrefix}New_${l}`}>
                        {noun} ({LANG_NAMES[l]})
                      </Label>
                      <Input
                        id={`${idPrefix}New_${l}`}
                        value={newExtra[l] ?? ""}
                        onChange={(e) => setNewExtra((prev) => ({ ...prev, [l]: e.target.value }))}
                      />
                    </>,
                  ]),
                )
              : {}),
          }}
        />
        <Button type="button" variant="outline" size="sm" disabled={pending} onClick={handleAdd}>
          <Plus /> Add {noun.toLowerCase()}
        </Button>
      </div>
    </div>
  );
}

function LocalizedRowItem({
  item,
  noun,
  editsExtra,
  disableUp,
  disableDown,
  onMoveUp,
  onMoveDown,
  onRemove,
  onSave,
}: {
  item: LocalizedRow;
  noun: string;
  editsExtra: boolean;
  disableUp: boolean;
  disableDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  onSave: (data: LocalizedRowInput) => void;
}) {
  const [textEn, setTextEn] = useState(item.textEn);
  const [textZh, setTextZh] = useState(item.textZh ?? "");
  const [extra, setExtra] = useState<TextI18n>(item.textI18n);
  const save = (next: TextI18n = extra) =>
    onSave({ textEn, textZh, ...(editsExtra && { textI18n: next }) });

  return (
    <li className="grid gap-2 rounded-lg border p-3 sm:grid-cols-[1fr_auto] sm:items-center">
      <Multilingual
        fields={{
          en: (
            <Input
              aria-label={`${noun} (English)`}
              value={textEn}
              onChange={(e) => setTextEn(e.target.value)}
              onBlur={() => save()}
            />
          ),
          zh: (
            <Input
              aria-label={`${noun} (Chinese)`}
              value={textZh}
              onChange={(e) => setTextZh(e.target.value)}
              onBlur={() => save()}
            />
          ),
          ...(editsExtra
            ? Object.fromEntries(
                EXTRA_LANGS.map((l) => [
                  l,
                  <Input
                    key={l}
                    aria-label={`${noun} (${LANG_NAMES[l]})`}
                    value={extra[l] ?? ""}
                    onChange={(e) => setExtra((prev) => ({ ...prev, [l]: e.target.value }))}
                    onBlur={() => save()}
                  />,
                ]),
              )
            : {}),
        }}
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
