"use client";

import { useState } from "react";
import { ChevronDown, FileText, Layers, LockKeyhole, Pencil, Search, Trash2 } from "lucide-react";
import { hasWebsitePreviewSlot, websiteCopyOrder, isFixedWebsiteMedia, isFixedWebsiteText, websiteTextLimit } from "@/lib/kawada-editor";
import { websiteFieldLabel } from "@/lib/kawada-field-labels";
import { websiteSectionLock } from "@/lib/kawada-section-locks";
import type { WebsiteCopyRow } from "@/lib/website-copy-history";
import { EditorConfirmation } from "./editor-confirmation";
import { kawadaSections } from "@/lib/kawada-sections";
import { changeCopy } from "./actions";

import { SectionMedia, type MediaItem } from "./section-media";

export function SectionEditor({ page, language, rows, media, zh, selected, openSection }: {
  page: string; language: string; rows: WebsiteCopyRow[]; media: MediaItem[]; zh: boolean; selected?: number; openSection?: number;
}) {
  const [query, setQuery] = useState("");
  const [removing, setRemoving] = useState<WebsiteCopyRow | null>(null);
  const sections = kawadaSections[page];
  const orderedRows = [...rows].sort((a,b) => websiteCopyOrder(page,a.position) - websiteCopyOrder(page,b.position));
  const needle = query.trim().toLowerCase();
  return <div className="space-y-4">
    <label className="flex items-center gap-3 rounded-xl border bg-card px-4 py-3">
      <Search size={17} className="text-muted-foreground" />
      <input className="w-full bg-transparent outline-none" aria-label={zh ? "搜索内容" : "Search content"} placeholder={zh ? "搜索栏目或内容…" : "Search sections or page content…"} value={query} onChange={e => setQuery(e.target.value)} />
    </label>
    <div className="overflow-hidden rounded-xl border bg-card divide-y">
      {sections.map(([start, en, cn], index) => {
        const end = sections[index + 1]?.[0] ?? Infinity;
        const title = zh ? cn : en;
        const withinSection = (position: number) => websiteCopyOrder(page,position) >= start && websiteCopyOrder(page,position) < end;
        const sectionRows = orderedRows.filter(r => withinSection(r.position));
        const entries = sectionRows.filter(r => !isFixedWebsiteText(page,r.position));
        const explanation = websiteSectionLock(page, start, zh);
        const matches = title.toLowerCase().includes(needle) ? entries : entries.filter(r => r.text.toLowerCase().includes(needle) || websiteFieldLabel(page, r.position, zh).toLowerCase().includes(needle));
        const assets = media.filter(m => m.section === start && (!needle || title.toLowerCase().includes(needle) || m.label.toLowerCase().includes(needle)));
        if (needle && !matches.length && !assets.length && !title.toLowerCase().includes(needle)) return null;
        return <details id={`section-${start}`} key={start} open={Boolean(needle) || openSection === start || (selected !== undefined && withinSection(selected))} className="group/section">
          <summary className="flex cursor-pointer items-center gap-4 px-4 py-4 hover:bg-muted/40">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary"><Layers size={18}/></span>
            <span className="min-w-0 flex-1"><strong className="block">{title}</strong><span className="block truncate text-sm text-muted-foreground">{entries[0]?.text ?? explanation}</span></span>
            <span className="text-sm text-muted-foreground">{entries.length} {zh ? "项" : "entries"}{assets.length > 0 && <> · {assets.length} {zh ? "个媒体" : "media"}</>}</span>
            <ChevronDown size={16} className="group-open/section:rotate-180"/>
          </summary>
          {explanation && <p className="flex items-start gap-2 border-t px-4 py-3 text-sm text-muted-foreground"><LockKeyhole size={16} className="mt-0.5 shrink-0"/>{explanation}</p>}
          {!isFixedWebsiteMedia(page, start) && <SectionMedia page={page} language={language} section={start} zh={zh} items={assets}/>}
          <div className="divide-y border-t bg-muted/20 px-4 sm:px-8">{matches.map(row =>
            <details key={row.position} id={`field-${row.position}`} open={selected === row.position} className="scroll-mt-24">
              <summary className="flex cursor-pointer items-start gap-3 py-3 text-sm"><FileText size={16} className="mt-0.5 shrink-0 text-muted-foreground"/><span className="min-w-0 flex-1"><strong className="block">{websiteFieldLabel(page, row.position, zh)}</strong>
                {!hasWebsitePreviewSlot(page, language, row.position) && <small className="block text-muted-foreground">
                  {zh ? "此文字没有页面预览位置" : "No inline preview for this field"}
                </small>}<span className="block whitespace-pre-wrap">{row.text}</span></span><Pencil size={15} className="shrink-0 text-primary" /></summary>
              <form id={`edit-copy-${row.position}`} action={changeCopy.bind(null,page,language,row.position)} className="pb-4">
                <input type="hidden" name="original" value={row.text}/>
                <input type="hidden" name="version" value={row.version}/>
                <label htmlFor={`copy-${row.position}`} className="mb-1 block text-sm font-medium">{websiteFieldLabel(page, row.position, zh)} <span className="font-normal text-muted-foreground">({websiteTextLimit(row.text)} {zh ? "字符上限" : "characters max"})</span></label>
                <textarea id={`copy-${row.position}`} key={row.text} name="text" defaultValue={row.text} required maxLength={websiteTextLimit(row.text)} rows={3} className="w-full rounded-lg border bg-background p-3"/>
                <div className="mt-2 flex gap-4"><button className="rounded-md bg-primary px-4 py-1.5 text-primary-foreground">{zh ? "保存" : "Save changes"}</button><button type="button" onClick={() => setRemoving(row)} className="flex items-center gap-2 text-destructive"><Trash2 size={14}/>{zh ? "移除" : "Remove"}</button></div>
              </form>
            </details>
          )}</div>
        </details>;
      })}
      {needle && !media.some(m => m.label.toLowerCase().includes(needle)) && !rows.some(row => !isFixedWebsiteText(page,row.position) && (row.text.toLowerCase().includes(needle) || websiteFieldLabel(page, row.position, zh).toLowerCase().includes(needle))) && !sections.some(s => s[zh ? 2 : 1].toLowerCase().includes(needle)) && <p className="p-5 text-muted-foreground">{zh ? "没有匹配的内容" : "No matching entries"}</p>}
    </div>
    {removing && <EditorConfirmation title={zh ? "移除此文字？" : "Remove this text?"}
      cancelLabel={zh ? "取消" : "Cancel"} onCancel={() => setRemoving(null)}
      confirm={<button form={`edit-copy-${removing.position}`} formNoValidate name="operation" value="remove"
        onClick={() => setTimeout(() => setRemoving(null), 0)}
        className="rounded-md bg-destructive px-3 py-2 text-white">{zh ? "移除文字" : "Remove text"}</button>}>
      <p className="font-medium">{websiteFieldLabel(page, removing.position, zh)}</p>
      <p className="max-h-48 overflow-auto whitespace-pre-wrap break-words rounded-md bg-muted p-3">{removing.text}</p>
      <p>{zh ? "移除后可在“已移除的文字”中恢复。" : "You can restore this field from Removed text."}</p>
    </EditorConfirmation>}
  </div>;
}
