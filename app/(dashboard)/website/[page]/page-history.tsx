"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { hasWebsitePreviewSlot, isFixedWebsiteText } from "@/lib/kawada-editor";
import { websiteFieldLabel, websiteSection } from "@/lib/kawada-field-labels";
import type { WebsiteCopyState } from "@/lib/website-copy-history";
import { restoreCopy } from "./actions";
import { EditorConfirmation } from "./editor-confirmation";

export type PageHistoryEntry = {
  id: string;
  position: number;
  before: string | null;
  after: string | null;
  action: string;
  userEmail: string | null;
  createdAt: string;
  current: WebsiteCopyState | null;
};

export function PageHistory({ page, language, languageLabel, zh, removed, justRemoved, entries }: {
  page: string;
  language: string;
  languageLabel: string;
  zh: boolean;
  removed: boolean;
  justRemoved: boolean;
  entries: PageHistoryEntry[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<PageHistoryEntry | null>(null);
  const [message, setMessage] = useState("");
  const [error, setError] = useState(false);
  const [busy, setBusy] = useState(false);
  const labels: Record<string, string> = zh
    ? { update: "已编辑", remove: "已移除", restore: "已恢复" }
    : { update: "Edited", remove: "Removed", restore: "Restored" };
  const restoreLabel = zh ? "恢复此版本" : "Restore this version";
  const empty = zh ? "无文字" : "No text";

  async function restore() {
    if (!selected?.current || busy) return;
    setBusy(true);
    setError(false);
    try {
      const result = await restoreCopy(page, language, {
        revisionId: selected.id,
        position: selected.position,
        expected: selected.current,
      });
      setSelected(null);
      setError(result !== "saved");
      setMessage(result === "saved"
        ? (zh ? "已恢复并保存到工作区。" : "Version restored and saved to the workspace.")
        : (zh ? "此字段已更改。请刷新历史记录，核对最新文字后再恢复。" : "This field changed. Refresh history and review the current wording before restoring."));
    } catch {
      setError(true);
      setMessage(zh ? "恢复失败，请重试。" : "Restore failed. Please try again.");
      setSelected(null);
    } finally {
      setBusy(false);
    }
  }

  return <section id="page-history" className="scroll-mt-24 space-y-4 rounded-xl border bg-card p-5">
    <div>
      <h2 className="text-xl font-semibold">{removed ? (zh ? "已移除的文字" : "Removed text") : (zh ? "页面历史" : "Page history")} · {languageLabel}</h2>
      <p className="mt-1 text-sm text-muted-foreground">{zh ? "恢复操作会保存到工作区。请在网站发布时纳入恢复后的文字。" : "Restoring saves to the workspace. Include the restored wording in the website release to make it live."}</p>
    </div>
    {justRemoved && entries.length > 0 && !message && <p role="status" className="text-sm">
      {zh ? "已从工作区移除。可在下方恢复文字。" : "Removed from the workspace. You can restore the text below."}
    </p>}
    {message && <div role={error ? "alert" : "status"} className="flex flex-wrap items-center gap-2 text-sm">
      <p>{message}</p>
      {error && <button type="button" className="text-primary underline" onClick={() => {
        router.refresh();
        setMessage("");
      }}>{zh ? "刷新历史记录" : "Refresh history"}</button>}
    </div>}
    {entries.length === 0 && <p className="text-sm text-muted-foreground">{removed
      ? (zh ? "此语言没有待恢复的文字。" : "There is no removed text for this language.")
      : (zh ? "此语言还没有保存记录。" : "There are no saved changes for this language yet.")}</p>}
    <div className="divide-y">
      {entries.map(entry => {
        const field = websiteFieldLabel(page, entry.position, zh);
        const section = websiteSection(page, entry.position)?.[zh ? 2 : 1];
        const canRestore = entry.before !== null && entry.current && entry.before !== entry.current.text
          && !isFixedWebsiteText(page, entry.position);
        return <details key={entry.id} className="py-3">
          <summary className="cursor-pointer text-sm">
            <strong>{section} · {field}</strong>
            <span className="ml-2 text-muted-foreground">{labels[entry.action]} · <time dateTime={entry.createdAt}>
              {new Intl.DateTimeFormat(zh ? "zh-CN" : "en-GB", {
                dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Shanghai",
              }).format(new Date(entry.createdAt))}
            </time> · {entry.userEmail ?? (zh ? "编辑者未知" : "Unknown editor")}</span>
          </summary>
          <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-3">
            {[
              [zh ? "更改前" : "Before this change", entry.before],
              [zh ? "更改后" : "After this change", entry.after],
              [zh ? "当前工作区文字" : "Current workspace wording", entry.current?.text],
            ].map(([label, value]) => <div key={label} className="min-w-0 rounded-md bg-muted/45 p-3">
              <dt className="mb-1 font-medium">{label}</dt>
              <dd className="whitespace-pre-wrap break-words">{value ?? empty}</dd>
            </div>)}
          </dl>
          {canRestore && <button type="button" disabled={busy} className="mt-3 rounded-md border px-3 py-2 text-sm text-primary"
            onClick={() => { setMessage(""); setSelected(entry); }}>{restoreLabel}</button>}
        </details>;
      })}
    </div>
    {selected && <EditorConfirmation title={restoreLabel} cancelLabel={zh ? "取消" : "Cancel"}
      onCancel={() => { if (!busy) setSelected(null); }}
      confirm={<button type="button" disabled={busy} className="rounded-md bg-primary px-3 py-2 text-primary-foreground disabled:opacity-60"
        onClick={restore}>{busy ? (zh ? "正在恢复…" : "Restoring…") : (zh ? "恢复到工作区" : "Restore to workspace")}</button>}>
      <p className="font-medium">{websiteFieldLabel(page, selected.position, zh)} · {languageLabel}</p>
      {!hasWebsitePreviewSlot(page, language, selected.position) && <p className="text-muted-foreground">
        {zh ? "此字段会恢复至原栏目。当前页面预览没有该字段的位置。" : "This field returns to its original section. The current preview has no inline slot for it."}
      </p>}
      <p className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3">{selected.before}</p>
    </EditorConfirmation>}
  </section>;
}
