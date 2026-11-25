"use client";

import { useState } from "react";
import { isTemplateMediaSlot } from "@/lib/kawada-editor";
import { useRouter } from "next/navigation";
import { FileText, Plus } from "lucide-react";

export type MediaItem = { id: string; section: number; kind: string; label: string; url: string | null; version: number };
type Context = { page: string; language: string; section: number; zh: boolean };

export function MediaForm({ item, context, close }: { item?: MediaItem; context: Context; close: () => void }) {
  const router = useRouter();
  const { zh } = context;
  const locked = isTemplateMediaSlot(item?.id);
  const [kind,setKind] = useState(item?.kind ?? "image");
  const [fileName, setFileName] = useState("");
  const [error,setError] = useState("");
  const [busy,setBusy] = useState(false);
  async function submit(form: FormData) {
    setBusy(true);
    try {
      for (const [k,v] of Object.entries(context)) form.set(k,String(v));
      form.set("kind", kind);
      if (item) { form.set("id",item.id); form.set("version",String(item.version)); }
      const response = await fetch("/api/website-media",{ method:"POST",body:form });
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        setError(result?.error ?? (zh ? "无法保存媒体，请重试。" : "Could not save media. Please try again."));
        return;
      }
      router.refresh();
      close();
    } catch { setError(zh ? "连接失败，请重试。" : "Connection failed. Please try again."); }
    finally { setBusy(false); }
  }
  return <form action={submit} className="grid gap-3 border-t p-3 text-sm">
    <label>{zh ? "名称" : "Media label"}<input className="block w-full rounded border p-2" name="label" defaultValue={item?.label} required maxLength={300}/></label>
    <label>{zh ? "类型" : "Type"}<select disabled={locked} name="kind" value={kind} onChange={e=>setKind(e.target.value)} className="ml-2 rounded border p-1"><option value="image">{zh?"图片":"Image"}</option><option value="video">{zh?"视频":"Video"}</option><option value="document">PDF</option></select></label>
    <label>{zh ? "选择文件（最多 4 MB）" : "Choose file (up to 4 MB)"}<input type="file" name="file" accept={kind==="image"?"image/jpeg,image/png,image/webp,image/gif":kind==="video"?"video/mp4":"application/pdf"} className="peer sr-only" onChange={event => setFileName(event.target.files?.[0]?.name ?? "")}/><span className="mt-1 block cursor-pointer rounded border p-2 peer-focus-visible:ring-2">{fileName || (zh ? "浏览文件…" : "Browse files…")}</span></label>
    <label>{zh ? "或使用 HTTPS 链接" : "Or use a hosted HTTPS URL"}<input type="url" name="url" defaultValue={item?.url ?? ""} className="block w-full rounded border p-2" placeholder="https://"/></label>
    {error && <p role="alert" className="text-destructive">{error}</p>}
    <div className="flex flex-wrap gap-3"><button disabled={busy} className="rounded bg-primary px-3 py-1 text-primary-foreground">{zh?"保存":"Save"}</button><button type="button" onClick={close}>{zh?"取消":"Cancel"}</button>{item && !locked && <button disabled={busy} name="operation" value="remove" formNoValidate className="ml-auto text-destructive">{zh?"移除":"Remove"}</button>}</div>
  </form>;
}

export function SectionMedia({ items, ...context }: Context & {items: MediaItem[]}) {
  const [editing,setEditing] = useState<string | null>(null);
  const {zh} = context;
  return <div className="border-t bg-muted/10 p-4">
    <div className="mb-3 flex items-center justify-between"><h3 className="font-semibold">{zh?"图片、视频与文件":"Section media"}</h3>{!(context.page === "home" && context.section === 12) && <button onClick={()=>setEditing("new")} className="flex items-center gap-1 text-sm text-primary"><Plus size={16}/>{zh?"添加媒体":"Add media"}</button>}</div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {editing==="new" && <div className="rounded-lg border bg-card"><MediaForm context={context} close={()=>setEditing(null)}/></div>}
      {items.map(item=>{
        const src=item.url ?? `/api/website-media/${item.id}?v=${item.version}`;
        return <article key={item.id} className="overflow-hidden rounded-lg border bg-card">
          {item.kind==="image" ? <img src={src} alt={item.label} loading="lazy" className="aspect-video w-full bg-muted object-contain"/> : item.kind==="video" ? <video src={src} aria-label={item.label} controls preload="none" className="aspect-video w-full bg-black"/> : <a href={src} target="_blank" rel="noreferrer" className="flex aspect-video items-center justify-center gap-2 bg-muted"><FileText/>PDF ↗</a>}
          <div className="flex items-start justify-between gap-2 p-3 text-sm"><span className="break-words">{item.label}</span><button className="text-primary" onClick={()=>setEditing(item.id)}>{zh?"编辑":"Edit"}</button></div>
          {editing===item.id && <MediaForm item={item} context={context} close={()=>setEditing(null)}/>}
        </article>;
      })}
    </div>
  </div>;
}
