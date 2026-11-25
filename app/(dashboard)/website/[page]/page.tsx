import { createHash } from "node:crypto";
import assetManifest from "@/lib/kawada-preview-media.json";
import { VisualEditor } from "./visual-editor";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { getLocale } from "@/lib/i18n";
import { websitePage } from "./content";
import { SectionEditor } from "./section-editor";
import { PageHistory } from "./page-history";

const languages = { en: "English", zh: "中文", es: "Español" };

export default async function WebsiteEditor({ params, searchParams }: {
  params: Promise<{ page: string }>;
  searchParams: Promise<{ lang?: string; status?: string; selected?: string; view?: string; history?: string; section?: string }>;
}) {
  const [{ page }, query, locale] = await Promise.all([params, searchParams, getLocale()]);
  const zh = locale === "zh";
  const language = query.lang ?? locale;
  const { definition, where } = await websitePage(page, language);
  const viewingHistory = query.history === "all" || query.history === "removed";
  const [rows, media, revisions] = await Promise.all([
    prisma.websiteCopy.findMany({ where, orderBy: { position: "asc" } }),
    prisma.websiteMedia.findMany({ where, select: { id:true, section:true, kind:true, label:true, url:true, version:true }, orderBy: [{section:"asc"},{label:"asc"},{id:"asc"}] }),
    viewingHistory ? prisma.websiteCopyRevision.findMany({
      where, orderBy: [{ createdAt: "desc" }, { version: "desc" }, { position: "asc" }],
      select: { id: true, position: true, version: true, before: true, after: true, action: true, userEmail: true, createdAt: true },
    }) : [],
  ]);
  const url = `https://kawada.steez.digital/${language}/${page === "home" ? "" : page + "/"}`;
  const sectionView = query.view === "sections";
  const editorUrl = `/website/${page}?lang=${language}`;
  const slots = assetManifest[`${page}/${language}` as keyof typeof assetManifest] ?? [];
  const assetIds = slots.map(([section, source]) => createHash("md5")
    .update([where.tenantId, page, language, section, source].join("/")).digest("hex"));
  const savedRows = rows.map(({ position, text, version }) => ({ position, text, version }));
  const current = new Map(savedRows.map(row => [row.position, { text: row.text as string | null, version: row.version }]));
  const latest = new Map<number, (typeof revisions)[number]>();
  for (const revision of revisions) {
    if ((latest.get(revision.position)?.version ?? 0) < revision.version) latest.set(revision.position, revision);
  }
  const entries = revisions.flatMap(revision => {
    const last = latest.get(revision.position);
    const removed = !current.has(revision.position) && last?.after === null;
    if (query.history === "removed" && (!removed || last.id !== revision.id)) return [];
    return [{
      ...revision, createdAt: revision.createdAt.toISOString(),
      current: current.get(revision.position) ?? (removed ? { text: null, version: last.version } : null),
    }];
  });
  const editorProps = { page, language, zh, media, rows: savedRows,
    selected: query.selected === undefined ? undefined : Number(query.selected) };
  return (
    <section className="mx-auto w-full min-w-0 space-y-5">
      <header className="space-y-2">
        <h1 className="text-3xl font-semibold">{definition[zh ? 2 : 1]}</h1>
        <p className="text-sm text-muted-foreground">{zh ? "选择要编辑的语言。更改将保存到工作区。" : "Choose the language to edit. Changes are saved to the workspace."}</p>
        <a href={url} target="_blank" rel="noreferrer" className="text-sm font-medium text-primary underline">{zh ? "查看当前网站 ↗" : "View live page ↗"}</a>
      </header>
      <nav aria-label={zh ? "内容语言" : "Content language"} className="flex gap-4">
        {Object.entries(languages).map(([key, label]) => (
          <Link key={key} href={`/website/${page}?lang=${key}${sectionView ? "&view=sections" : ""}${viewingHistory ? "&history=" + query.history : ""}`} aria-current={language === key ? "page" : undefined}
            className={language === key ? "font-semibold underline" : "text-muted-foreground"}>{label}</Link>
        ))}
      </nav>
      {query.status === "saved" && <p role="status">{zh ? "已保存到工作区。" : "Saved to the workspace."}</p>}
      {query.status === "conflict" && <p role="alert">{zh ? "内容已更改，请查看最新版本。" : "This entry changed. Review the latest version before saving."}</p>}
      {query.status === "protected" && <p role="alert">{zh ? "此内容由网站模板管理。" : "The website template manages this content."}</p>}
      {query.status === "length" && <p role="alert">{zh ? "请输入符合长度限制的文字。" : "Enter text within the length shown for this field."}</p>}
      {!rows.length && <p>{zh ? "本页没有内容。" : "This page has no entries."}</p>}
      <nav aria-label={zh ? "编辑方式和历史" : "Editor views and history"} className="flex w-fit flex-wrap gap-1 rounded-lg border bg-muted p-1 text-sm">
        {[
          { href: editorUrl, label: zh ? "可视化编辑" : "Visual editor", active: !sectionView && !viewingHistory },
          { href: editorUrl + "&view=sections", label: zh ? "栏目编辑" : "Section editor", active: sectionView && !viewingHistory },
          { href: editorUrl + "&history=all", label: zh ? "页面历史" : "Page history", active: query.history === "all" },
          { href: editorUrl + "&history=removed", label: zh ? "已移除的文字" : "Removed text", active: query.history === "removed" },
        ].map(({ href, label, active }) => <Link key={href} href={href} aria-current={active ? "page" : undefined}
          className={`rounded-md px-3 py-2 ${active ? "bg-card font-medium shadow-sm" : ""}`}>{label}</Link>)}
      </nav>
      {viewingHistory ? <PageHistory key={page + language + query.history} page={page} language={language}
        languageLabel={languages[language as keyof typeof languages]} removed={query.history === "removed"}
        justRemoved={query.status === "removed"} zh={zh} entries={entries}/> :
        sectionView ? <SectionEditor key={page + language} {...editorProps} openSection={query.section === undefined ? undefined : Number(query.section)}/> :
          <VisualEditor key={page + language} {...editorProps} assetIds={assetIds}/>}
    </section>
  );
}
