"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { requestDashboardNavigation } from "@/lib/dashboard-navigation";
import { kawadaSections } from "@/lib/kawada-sections";
import { useEffect, useRef, useState } from "react";
import { hasWebsitePreviewSlot, websiteCopyOrder, isFixedWebsiteMedia, isFixedWebsiteText, websiteTextLimit } from "@/lib/kawada-editor";
import { websiteFieldLabel, websiteSection } from "@/lib/kawada-field-labels";
import { websiteSectionLock } from "@/lib/kawada-section-locks";
import type { WebsiteCopyEdit, WebsiteCopyRow } from "@/lib/website-copy-history";
import { DraftNavigation } from "./draft-navigation";
import { saveVisualCopy } from "./actions";
import { MediaForm, type MediaItem } from "./section-media";

type Props = {
  page: string; language: string; zh: boolean; rows: WebsiteCopyRow[]; media: MediaItem[];
  assetIds: string[]; selected?: number;
};

// These preview blocks rely on animations or interactive controls on the live site.
// A single editor section can cover more than one preview block.
const animatedBlocks: Record<string, [section: number, selector: string][]> = {
  home: [
    [4, 'section[aria-labelledby="range-grid-heading"], section:has([data-copy="6"])'],
    [12, "#whats-inside"],
    [39, 'section[aria-labelledby="absorb-heading"]'],
    [42, "#oem"],
    [57, "#home-innovation"],
    [79, 'section[aria-labelledby="partners-heading"], #testimonials'],
  ],
  "about-us": [[12, "#plants"], [48, "section.history"]],
  products: [[0, 'div[class*="CatalogueTransitionPreview_stage"]']],
  "oem-odm": [[4, "#ways-to-begin"], [17, "#walkthrough"], [157, "#faq"]],
  innovation: [[84, "#factory"]],
  catalogue: [[5, 'section[class*="CatalogueReader_reader"]']],
};

function sectionEditorHref(page: string, language: string, section: number) {
  return `/website/${page}?lang=${language}&view=sections&section=${section}#section-${section}`;
}

const editorStyle = `
  .visual-section-banner {position:relative;z-index:5;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:.65rem 1rem;padding:.75rem clamp(.75rem,3vw,1.5rem);background:#f5edf9;color:#412153;border-block:1px solid #dec8eb;font:500 .875rem/1.35 system-ui,sans-serif}
  .visual-section-banner button {padding:.5rem .75rem;border:1px solid #693a83;border-radius:.4rem;background:#693a83;color:white;font:inherit;font-weight:650;cursor:pointer}
  .visual-section-banner button:hover {background:#502869}
  .visual-section-banner button:focus-visible {outline:2px solid #693a83;outline-offset:3px}
  [data-editable] {cursor:text; border-radius:2px; pointer-events:auto}
  #hero-heading[data-heading-overridden] .loren-line {white-space:normal;text-wrap:balance}
  [data-editable]:empty:first-child::before {content:"\\200b";display:inline-block;min-width:.5em}
  [data-media-editable] {cursor:pointer}
  [data-editable]:hover,[data-editable]:focus-visible,[data-media-editable]:hover,
  [data-media-editable]:focus-visible {outline:2px dashed #9351ba;outline-offset:3px}
  [contenteditable="plaintext-only"] {outline:2px solid #703099;outline-offset:3px;white-space:pre-wrap}
  main [style*="opacity:0"][style*="translateY"] {opacity:1!important;transform:none!important}
  main section:has(> .sticky.h-svh), main section:has(> .pad-stage) {height:auto!important;min-height:0!important;margin-top:0!important}
  main section > .sticky.h-svh, main section > .pad-stage {position:relative!important;top:auto!important}
  .about-page #plants {height:auto}
  .about-page #plants > .sticky {height:auto;position:relative}
  .about-page #plants > .sticky > .flex {height:60vh}
  .about-page #plants > .sticky > .z-10 {position:relative;height:55vh;opacity:1!important;transform:none!important}
  .about-page #plants > .sticky > .z-20 {opacity:1!important;pointer-events:none}
  .about-page #plants > .sticky > .z-20 [data-editable] {pointer-events:auto}
  .about-page .history {height:auto}
  .about-page .history-sticky {position:relative;top:auto;height:auto;overflow:visible}
  .about-page .history-stage {overflow-x:auto;overscroll-behavior-x:contain;scrollbar-color:var(--primary) var(--muted)}
  @media (prefers-reduced-motion:no-preference) {
    .about-page .history-stage {--history-above:clamp(12rem,26vh,19rem);--history-below:clamp(13rem,28vh,20rem)}
    .about-page .history-track {padding-right:2rem;transform:none}
  }
  .site-header {background:var(--background,#fbfaf8);pointer-events:none}
  html {scroll-behavior:auto!important}
  *,*::before,*::after {animation-delay:0s!important;animation-duration:.001ms!important;animation-iteration-count:1!important}
`;

export function VisualEditor({page, language, rows, media, assetIds, selected, zh}: Props) {
  const router = useRouter();
  const sections = kawadaSections[page];
  const [section, setSection] = useState<number | undefined>(undefined);
  const [sectionHidden, setSectionHidden] = useState(false);
  const [phone, setPhone] = useState(false);
  const frame = useRef<HTMLIFrameElement>(null);
  const [html, setHtml] = useState("");
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(0);
  const [active, setActive] = useState<WebsiteCopyRow | null>(null);
  const [gallery, setGallery] = useState(false);
  const [gallerySection, setGallerySection] = useState<number | "all">("all");
  const [step, setStep] = useState(0);
  const [asset, setAsset] = useState<MediaItem | null>(null);
  const [draft, setDraft] = useState("");
  const drafts = useRef(new Map<number, WebsiteCopyEdit>());
  const dirty = useRef(false);
  const [draftList, setDraftList] = useState<WebsiteCopyEdit[]>([]);
  const count = draftList.length;
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [conflicted, setConflicted] = useState(false);
  const [revision, setRevision] = useState(0);
  const cancel = useRef<(discard?: boolean) => void>(() => {});

  function syncDraftCount() {
    dirty.current = drafts.current.size > 0;
    setDraftList([...drafts.current.values()]);
    if (!dirty.current) setConflicted(false);
  }

  function discardDrafts() {
    drafts.current.clear();
    cancel.current(false);
    syncDraftCount();
  }

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/kawada-preview/${page}-${language}.txt`, {signal: controller.signal})
      .then(async response => {
        if (!response.ok || !response.headers.get("content-type")?.includes("text/plain")) throw new Error();
        setHtml(await response.text());
      })
      .catch(() => { if (!controller.signal.aborted) setError(true); });
    return () => controller.abort();
  }, [page, language]);

  // Eager photos can finish long after the markup is ready for editing.
  useEffect(() => {
    if (!html) return;
    let timer: number;
    function checkDocument() {
      const doc = frame.current?.contentDocument;
      if (doc?.readyState !== "loading" && doc?.querySelector("main")) setLoaded(n => n + 1);
      else timer = window.requestAnimationFrame(checkDocument);
    }
    timer = window.requestAnimationFrame(checkDocument);
    return () => window.cancelAnimationFrame(timer);
  }, [html]);

  useEffect(() => {
    const doc = frame.current?.contentDocument;
    if (!loaded || !doc?.body) return;
    const style = doc.createElement("style");
    style.textContent = editorStyle;
    doc.head.append(style);
    const banners: HTMLElement[] = [];
    for (const [start, selector] of animatedBlocks[page] ?? []) {
      const definition = sections.find(([position]) => position === start);
      if (!definition) continue;
      for (const block of doc.querySelectorAll(`main :is(${selector})`)) {
        const banner = doc.createElement("div");
        banner.className = "visual-section-banner";
        banner.dataset.sectionBanner = String(start);
        const title = doc.createElement("strong");
        title.textContent = definition[zh ? 2 : 1];
        const button = doc.createElement("button");
        button.type = "button";
        button.textContent = zh ? "在栏目编辑器中编辑此栏目" : "Edit this section in Section editor";
        const href = sectionEditorHref(page, language, start);
        button.addEventListener("click", () => requestDashboardNavigation(href, () => router.push(href)));
        banner.append(title, button);
        block.before(banner);
        banners.push(banner);
      }
    }
    const groups = new Map<number, HTMLElement[]>();
    doc.querySelectorAll<HTMLElement>("[data-copy]").forEach(node => {
      const position = Number(node.dataset.copy);
      if (!groups.has(position)) groups.set(position, []);
      groups.get(position)!.push(node);
      node.dataset.original ??= node.textContent ?? "";
    });
    const current = new Map(rows.map(row => [row.position, row]));
    function display(nodes: HTMLElement[], value: string) {
      const banner = page === "home" && nodes[0].dataset.copy === "90";
      const original = nodes.map(node => node.dataset.original).join(banner && language !== "zh" ? " " : "")
        .replace(/\s+/g, " ").trim();
      if (banner) nodes[0].closest("#hero-heading")?.toggleAttribute("data-heading-overridden", original !== value);
      nodes.forEach((node, i) => {
        node.textContent = original === value ? node.dataset.original! : i === 0 ? value : "";
      });
    }
    groups.forEach((nodes, position) => {
      const row = current.get(position);
      display(nodes, drafts.current.get(position)?.text ?? row?.text ?? "");
      if (!row || isFixedWebsiteText(page, position)) {
        nodes.forEach(node => {
          delete node.dataset.editable;
          for (const attribute of ["tabindex", "role", "aria-label", "title"]) node.removeAttribute(attribute);
        });
        return;
      }
      const label = websiteFieldLabel(page, position, zh);
      nodes.forEach(node => { node.dataset.editable = ""; node.title = label; });
      nodes[0].tabIndex = 0;
      nodes[0].setAttribute("role", "button");
      nodes[0].setAttribute("aria-label", label);
    });
    const items = new Map(media.map(item => [item.id, item]));
    doc.querySelectorAll<HTMLElement>("[data-asset]").forEach(node => {
      const item = items.get(assetIds[Number(node.dataset.asset)]);
      if (!item) { node.style.display = "none"; return; }
      if (isFixedWebsiteMedia(page, item.section)) return;
      node.dataset.mediaEditable = "";
      node.tabIndex = 0;
      node.title = item.label;
      if (item.version) {
        const tag = item.kind === "image" ? "IMG" : item.kind === "video" ? "VIDEO" : "A";
        const url = item.url ?? `/api/website-media/${item.id}?v=${item.version}`;
        if (tag !== node.tagName) {
          const replacement = doc.createElement(tag);
          for (const attr of ["class", "style", "data-asset", "data-media-editable", "tabindex"]) {
            replacement.setAttribute(attr, node.getAttribute(attr) ?? "");
          }
          node.replaceWith(replacement);
          node = replacement;
        }
        node.parentElement?.querySelectorAll("picture > source:not([data-picture-source])").forEach(source => source.removeAttribute("srcset"));
        node.removeAttribute("srcset");
        node.title = item.label;
        if (tag === "A") node.textContent = item.label;
        else {
          node.setAttribute("src", url);
          if (tag === "IMG") node.setAttribute("alt", item.label);
          if (tag === "VIDEO") node.setAttribute("preload", "metadata");
        }
      }
    });
    for (const [selector, key, attribute] of [
      ["video[data-poster]", "poster", "poster"], ["source[data-picture-source]", "pictureSource", "srcset"]
    ] as const) {
      doc.querySelectorAll<HTMLElement>(selector).forEach(node => {
        const item = items.get(assetIds[Number(node.dataset[key])]);
        if (item?.version) node.setAttribute(attribute, item.url ?? `/api/website-media/${item.id}?v=${item.version}`);
      });
    }
    const restored = groups.get(selected ?? -1)?.[0];
    restored?.scrollIntoView({block:"center"});
    let editing: HTMLElement | null = null;
    function activate(event: Event) {
      const target = event.target as HTMLElement | null;
      if (!target?.closest) return;
      if (target.closest("[data-section-banner]")) return;
      if (editing && editing.contains(target)) return;
      if (!editing && target.closest("summary") && !target.closest("[data-editable],[data-media-editable]")) return;
      event.preventDefault();
      if (editing) cancel.current(false);
      const text = target.closest<HTMLElement>("[data-editable]");
      if (!text) {
        const node = target.closest<HTMLElement>("[data-media-editable]");
        if (node) setAsset(items.get(assetIds[Number(node.dataset.asset)]) ?? null);
        return;
      }
      const position = Number(text.dataset.copy);
      const row = current.get(position)!;
      const nodes = groups.get(position)!;
      const field = text;
      const value = drafts.current.get(position)?.text ?? row.text;
      setSectionHidden(false);
      setSection(websiteSection(page, position)?.[0]);
      editing = field;
      nodes.forEach(node => { node.textContent = node === field ? value : ""; });
      field.contentEditable = "plaintext-only";
      field.setAttribute("role", "textbox");
      field.setAttribute("aria-label", websiteFieldLabel(page, position, zh));
      field.focus({preventScroll: true});
      const range = doc!.createRange();
      range.selectNodeContents(field);
      range.collapse(false);
      doc!.getSelection()?.removeAllRanges();
      doc!.getSelection()?.addRange(range);
      setActive(row);
      setDraft(value);
      setMessage("");
      cancel.current = (discard = true) => {
        if (discard) drafts.current.delete(position);
        syncDraftCount();
        field.removeAttribute("contenteditable");
        if (field === nodes[0]) field.setAttribute("role", "button");
        else {
          field.removeAttribute("role");
          field.removeAttribute("aria-label");
        }
        display(nodes, drafts.current.get(position)?.text ?? row.text);
        editing = null;
        setActive(null);
        cancel.current = () => {};
      };
    }
    function input() {
      if (!editing) return;
      const position = Number(editing.dataset.copy);
      const existing = drafts.current.get(position);
      const row = current.get(position)!;
      const original = existing?.original ?? row.text;
      const version = existing?.version ?? row.version;
      // textContent avoids a layout pass on each ordinary keystroke. Read
      // rendered line breaks only when a paste or Enter created child elements.
      const text = editing.childElementCount ? editing.innerText : editing.textContent ?? "";
      if (text === original) drafts.current.delete(position);
      else drafts.current.set(position, {position, original, text, version});
      syncDraftCount();
      setDraft(text);
    }
    function key(event: KeyboardEvent) {
      if (editing && event.key === "Escape") cancel.current();
      else if (!editing && (event.key === "Enter" || event.key === " ")) {
        if ((event.target as HTMLElement)?.closest("[data-editable],[data-media-editable]")) activate(event);
      }
    }
    doc.addEventListener("click", activate);
    doc.addEventListener("keydown", key);
    doc.addEventListener("input", input);
    return () => {
      if (editing) cancel.current(false);
      style.remove();
      banners.forEach(banner => banner.remove());
      doc.removeEventListener("click", activate);
      doc.removeEventListener("keydown", key);
      doc.removeEventListener("input", input);
    };
  }, [loaded, page, language, rows, media, assetIds, sections, zh, selected, revision, router]);

  function showStep(index: number) {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const panels = doc.querySelectorAll<HTMLElement>("#walkthrough [role=tabpanel]");
    panels.forEach((panel, i) => {
      const visible = index === i;
      panel.inert = !visible;
      panel.style.visibility = visible ? "visible" : "hidden";
      panel.setAttribute("aria-hidden", String(!visible));
      if (visible) {
        panel.querySelectorAll<HTMLElement>("[style]").forEach(child => {
          child.style.visibility = "visible";
          child.style.opacity = "1";
        });
        panel.scrollIntoView({block:"center"});
      }
    });
    doc.querySelectorAll("#walkthrough [role=tab]").forEach((tab, i) => tab.setAttribute("aria-selected", String(i === index)));
    setStep(index);
  }

  function openGalleryItem(item: MediaItem) {
    const doc = frame.current?.contentDocument;
    const slot = assetIds.indexOf(item.id);
    if (doc && slot >= 0) {
      const stage = doc.querySelector<HTMLImageElement>(`img[data-gallery-slots~="${slot}"]`);
      if (stage && item.kind === "image") {
        stage.dataset.asset = String(slot);
        stage.dataset.mediaEditable = "";
        stage.removeAttribute("srcset");
        stage.src = item.url ?? `/api/website-media/${item.id}?v=${item.version}`;
        stage.alt = item.label;
        stage.title = item.label;
        stage.scrollIntoView({block:"center"});
      } else {
        const node = doc.querySelector<HTMLElement>(`[data-asset="${slot}"]`);
        const panel = node?.closest("#walkthrough [role=tabpanel]");
        if (panel) showStep([...doc.querySelectorAll("#walkthrough [role=tabpanel]")].indexOf(panel));
        else node?.scrollIntoView({block:"center"});
      }
    }
    setSection(item.section);
    setAsset(item);
  }

  function jumpToSection(start: number) {
    cancel.current(false);
    setSection(start);
    setSectionHidden(false);
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const banner = doc.querySelector(`[data-section-banner="${start}"]`);
    if (banner) {
      banner.scrollIntoView({block: "center"});
      return;
    }
    const end = sections.find(([position]) => position > start)?.[0] ?? Infinity;
    const candidates = [...doc.querySelectorAll<HTMLElement>("[data-copy], [data-asset]")].filter(node => {
      if (node.dataset.copy !== undefined) {
        const position = websiteCopyOrder(page, Number(node.dataset.copy));
        return position >= start && position < end;
      }
      return media.find(item => item.id === assetIds[Number(node.dataset.asset)])?.section === start;
    });
    for (const node of candidates) {
      const details = node.closest("details");
      if (details) details.open = true;
      if (node.closest(".sr-only, [hidden], [inert]") || !node.getClientRects().length || node.checkVisibility?.({opacityProperty: true, visibilityProperty: true}) === false) continue;
      node.scrollIntoView({block: "center"});
      node.animate([{outline: "3px solid #9351ba"}, {outline: "3px solid transparent"}], 1100);
      return;
    }
    setSectionHidden(true);
  }

  async function save() {
    if (saving || !drafts.current.size) return;
    setSaving(true);
    try {
      const result = await saveVisualCopy(page, language, [...drafts.current.values()]);
      if (result === "saved") {
        discardDrafts();
        setRevision(value => value + 1);
        setMessage(zh ? "已保存到工作区。" : "Saved to the workspace.");
      } else if (result === "conflict") {
        setConflicted(true);
        setMessage(zh ? "内容已被其他人修改。请从下方复制草稿，刷新后核对最新文字。" : "Someone changed this content. Copy your drafts below, then refresh to review the latest text.");
      } else {
        setMessage(zh ? "请检查草稿。每项都需要文字，且不能超过字数限制。" : "Check your drafts. Each needs text within its character limit.");
      }
    } catch {
      setMessage(zh ? "保存失败。草稿已保留，请重试。" : "Save failed. Your drafts are still here. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const limit = active ? websiteTextLimit(active.text) : 0;
  const lock = section === undefined ? undefined : websiteSectionLock(page, section, zh);
  const textOutsidePreview = section === undefined ? [] : rows
    .filter(row => websiteSection(page, row.position)?.[0] === section && !isFixedWebsiteText(page, row.position)
      && !hasWebsitePreviewSlot(page, language, row.position))
    .sort((a, b) => websiteCopyOrder(page, a.position) - websiteCopyOrder(page, b.position));
  return <div className="overflow-hidden rounded-xl border bg-card">
    <DraftNavigation draftCount={count} dirty={dirty} zh={zh} discard={discardDrafts}
      resume={() => frame.current?.contentDocument?.querySelector<HTMLElement>('[contenteditable="plaintext-only"]')?.focus({ preventScroll: true })}/>
    <div className="flex flex-wrap items-center gap-3 border-b bg-muted/30 px-4 py-2 text-sm">
      <label className="flex items-center gap-2">{zh ? "页面栏目" : "Page section"}
        <select aria-label={zh ? "页面栏目" : "Page section"} disabled={!loaded} value={section ?? ""} onChange={event => jumpToSection(Number(event.target.value))}
          className="max-w-56 rounded-md border bg-background px-2 py-1.5">
          <option value="" disabled>{zh ? "跳转到栏目…" : "Jump to section…"}</option>
          {sections.map(([start, en, cn]) => <option key={start} value={start}>{zh ? cn : en}</option>)}
        </select>
      </label>
      {page === "about-us" && section === 48 && <label className="flex items-center gap-2">
        {zh ? "里程碑" : "Milestone"}
        <select value="" className="rounded-md border bg-background px-2 py-1.5" onChange={event => {
          const year = frame.current?.contentDocument?.querySelector<HTMLElement>(`.history-year [data-copy="${Number(event.target.value)}"]`);
          year?.scrollIntoView({block:"center", inline:"center"});
          year?.focus({preventScroll:true});
        }}>
          <option disabled value="">{zh ? "跳转至…" : "Go to…"}</option>
          {rows.filter(row => [51,53,55,57,59,61].includes(row.position)).map(row =>
            <option key={row.position} value={row.position}>{row.text}</option>)}
        </select>
      </label>}
      {page === "oem-odm" && section === 17 && <label className="flex items-center gap-2">{zh ? "生产步骤" : "Process step"}
        <select value={step} onChange={event => showStep(Number(event.target.value))} className="rounded-md border bg-background px-2 py-1.5">
          {(zh ? ["需求沟通","合同","材料","打样","制造","检验","出货与售后"] :
            ["Brief","Contract","Materials","Sampling","Manufacturing","Inspection","Shipment & after-sales"]).map((label, i) =>
              <option key={i} value={i}>{i+1} · {label}</option>)}
        </select></label>}
      {sectionHidden && <span role="status">{zh ? "此栏目使用交互式布局。" : "This section uses an interactive layout."}</span>}
      {section !== undefined && <Link href={sectionEditorHref(page, language, section)}
        className="text-primary underline">{zh ? "在栏目编辑器中打开此栏目" : "Open this section in Section editor"}</Link>}
      {media.length > 0 && <button type="button" onClick={() => {
        setGallerySection(media.some(item => item.section === section) ? section! : "all");
        setGallery(true);
      }} className="rounded-md border bg-background px-3 py-1.5">{zh ? "浏览页面媒体" : "Browse page media"}</button>}
      <button type="button" aria-pressed={phone} onClick={() => setPhone(!phone)}
        className="ml-auto rounded-md border bg-background px-3 py-1.5">{zh ? "手机预览" : "Phone preview"}</button>
    </div>
    {lock && <p className="border-b px-4 py-2 text-sm text-muted-foreground">{lock}</p>}
    {textOutsidePreview.length > 0 && <details className="border-b px-4 py-2 text-sm">
      <summary className="cursor-pointer">{zh ? "无页面预览位置的栏目文字" : "Section text without an inline preview"}</summary>
      <dl className="mt-2 space-y-2">
        {textOutsidePreview.map(row => <div key={row.position}>
          <dt className="font-medium">{websiteFieldLabel(page, row.position, zh)}</dt>
          <dd className="whitespace-pre-wrap break-words">{row.text}</dd>
        </div>)}
      </dl>
    </details>}
    <div className="flex min-h-14 flex-wrap items-center justify-between gap-2 border-b px-4 py-2 text-sm" aria-live="polite">
      {active || count ? <div className="flex w-full flex-wrap items-center gap-3">
        <span className="mr-auto text-muted-foreground">{active && <span className={draft.length > limit ? "text-destructive" : ""}>
          <strong className="text-foreground">{websiteFieldLabel(page, active.position, zh)}</strong> · {draft.length} / {limit}　</span>}{count > 0 && <span>{zh ? `${count} 项未保存` : `${count} unsaved`}</span>}</span>
        {active && <button disabled={saving} type="button" onClick={() => cancel.current()}>{zh ? "取消" : "Cancel"}</button>}
        <button type="button" onClick={save} disabled={saving || !count} className="rounded-md bg-primary px-4 py-2 text-primary-foreground disabled:opacity-50">{zh ? "保存到工作区" : "Save to workspace"}</button>
      </div> : <span>{zh ? "点击页面上的文字直接编辑，或点击图片更换媒体。" : "Click text to edit it on the page, or select an image to change its media."}</span>}
    </div>
    {message && <p role="status" className="border-b px-4 py-2 text-sm">{message}</p>}
    {conflicted && <details open className="space-y-2 border-b p-4 text-sm">
      <summary className="cursor-pointer font-medium">{zh ? "复制保留的草稿" : "Copy your drafts"}</summary>
      {draftList.map(edit => <label key={edit.position} className="block">
        {websiteFieldLabel(page, edit.position, zh)}
        <textarea readOnly rows={2} value={edit.text} className="mt-1 block w-full rounded-md border bg-background p-2"/>
      </label>)}
    </details>}
    {error ? <p role="alert" className="p-5">{zh ? "页面预览加载失败。请打开栏目编辑器。" : "The preview could not load. Open the section editor to continue."}</p> :
      html ? <iframe ref={frame} inert={saving} sandbox="allow-same-origin" srcDoc={html}
        title={zh ? "可视化页面编辑器" : "Visual page editor"} className={`mx-auto block h-[72dvh] min-h-80 w-full bg-white ${phone ? "max-w-[390px] border-x" : ""}`}/> :
        <p role="status" className="p-5">{zh ? "正在加载页面…" : "Loading page…"}</p>}
    {(gallery || asset) && <dialog ref={node => { if (node && !node.open) node.showModal(); }}
      onCancel={event => { event.preventDefault(); setAsset(null); setGallery(false); }}
      aria-label={asset?.label ?? (zh ? "页面媒体" : "Page media")} className="fixed inset-0 m-auto max-h-[85dvh] w-[min(94vw,50rem)] overflow-y-auto rounded-xl border bg-card p-4 text-card-foreground backdrop:bg-black/40">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h2 className="font-semibold">{asset?.label ?? (zh ? "页面媒体" : "Page media")}</h2>
        <button type="button" onClick={() => { setAsset(null); setGallery(false); }}>{zh ? "关闭" : "Close"}</button>
      </div>
      {asset ? <div>
        {asset.kind === "image" && <img src={asset.url ?? `/api/website-media/${asset.id}?v=${asset.version}`} alt={asset.label} className="mx-auto max-h-56 max-w-full object-contain"/>}
        <MediaForm key={asset.id} item={asset} context={{page,language,section:asset.section,zh}} close={() => setAsset(null)}/>
      </div> : <>
        <label className="flex flex-wrap items-center gap-2 text-sm">{zh ? "筛选栏目" : "Filter by section"}
          <select value={gallerySection} onChange={event => setGallerySection(event.target.value === "all" ? "all" : Number(event.target.value))}
            className="rounded-md border bg-background px-2 py-1.5">
            <option value="all">{zh ? "全部栏目" : "All sections"}</option>
            {sections.filter(([start]) => media.some(item => item.section === start)).map(([start,en,cn]) =>
              <option key={start} value={start}>{zh ? cn : en}</option>)}
          </select>
        </label>
        {sections.map(([start,en,cn]) => {
          if (gallerySection !== "all" && gallerySection !== start) return null;
          const items = media.filter(item => item.section === start);
          if (!items.length) return null;
          return <section key={start} className="mt-5"><h3 className="mb-2 text-sm font-medium">{zh ? cn : en}</h3>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">{items.map(item =>
              <button key={item.id} onClick={() => openGalleryItem(item)} className="overflow-hidden rounded-lg border text-left hover:border-primary">
                {item.kind === "image" ? <img src={item.url ?? `/api/website-media/${item.id}?v=${item.version}`} alt="" loading="lazy" className="aspect-video w-full bg-muted object-contain"/> :
                  <span className="grid aspect-video place-items-center bg-muted text-sm">{item.kind === "video" ? (zh ? "视频" : "Video") : "PDF"}</span>}
                <span className="block break-words p-2 text-sm">{item.label}</span>
              </button>)}</div></section>;
        })}
      </>}
    </dialog>}
  </div>;
}
