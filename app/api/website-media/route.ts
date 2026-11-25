import { getLocale } from "@/lib/i18n";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { websitePage } from "@/app/(dashboard)/website/[page]/content";
import { isFixedWebsiteMedia, isTemplateMediaSlot } from "@/lib/kawada-editor";
import { kawadaSections } from "@/lib/kawada-sections";
import { sniffImageType } from "@/lib/image-sniff";
import { logAudit } from "@/lib/audit";

const limit = 4 * 1024 * 1024;


export async function POST(request: Request) {
  const chinese = (await getLocale()) === "zh";
  const failure = (en: string, zh: string, status = 400) => Response.json({ error: chinese ? zh : en }, { status });
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return failure("Invalid origin", "请求来源无效。", 403);
  if (Number(request.headers.get("content-length")) > limit + 65536) return failure("Use a hosted URL for files over 4 MB.", "文件超过 4 MB 时，请使用托管文件的 HTTPS 链接。", 413);
  const form = await request.formData();
  const page = String(form.get("page")), language = String(form.get("language"));
  const { where } = await websitePage(page, language);
  const section = Number(form.get("section"));
  if (!kawadaSections[page].some(([start]) => start === section)) return failure("Unknown section", "找不到此栏目。");
  if (isFixedWebsiteMedia(page, section)) return failure("The website template manages this animation.", "此动画由网站模板管理。", 403);
  const id = String(form.get("id") ?? "");
  const filter = { ...where, section, id, version: Number(form.get("version")) };
  const removing = form.get("operation") === "remove";
  const lockedSlot = isTemplateMediaSlot(id);
  if ((lockedSlot && removing) || (page === "home" && section === 12 && !lockedSlot)) {
    return failure("Replace the existing media in this animation slot.", "请替换此动画位置的现有媒体。", 403);
  }
  let entityId = id;
  if (removing) {
    if (!(await prisma.websiteMedia.deleteMany({ where: filter })).count) return failure("This item changed. Refresh and try again.", "此媒体已更改，请刷新后重试。", 409);
  } else {
    const label = String(form.get("label") ?? "").trim();
    const kind = String(form.get("kind"));
    if (!label || label.length > 300 || !["image","video","document"].includes(kind)) return failure("Enter a label and media type.", "请填写名称并选择媒体类型。");
    const file = form.get("file");
    const url = String(form.get("url") ?? "").trim();
    let source;
    if (file instanceof File && file.size) {
      if (file.size > limit) return failure("Use a hosted URL for files over 4 MB.", "文件超过 4 MB 时，请使用托管文件的 HTTPS 链接。", 413);
      const bytes = Buffer.from(await file.arrayBuffer());
      const mime = sniffImageType(bytes)?.mime ??
        (bytes.toString("ascii",4,8) === "ftyp" ? "video/mp4" :
         bytes.toString("ascii",0,5) === "%PDF-" ? "application/pdf" : "");
      if (!mime || (kind === "document" ? mime !== "application/pdf" : !mime.startsWith(kind+"/"))) return failure("The file must match the selected media type.", "文件必须与所选媒体类型匹配。");
      source = { file: new Uint8Array(bytes), mime, url: null };
    } else if (url) {
      if (!URL.canParse(url) || new URL(url).protocol !== "https:" || url.length > 4096) return failure("Enter an HTTPS media URL.", "请输入有效的 HTTPS 媒体链接。");
      source = { file: null, mime: null, url };
    } else if (!id) return failure("Choose a file or enter its HTTPS URL.", "请选择文件或输入 HTTPS 链接。");
    if (id) {
      const changed = await prisma.websiteMedia.updateMany({ where: { ...filter, ...(source && !lockedSlot ? {} : { kind }) }, data: { kind, label, ...source, version: { increment: 1 } } });
      if (!changed.count) return failure("Refresh this item or choose a replacement file.", "请刷新此媒体或选择替换文件。",409);
    } else {
      const item = await prisma.websiteMedia.create({ data: { ...where, section, label, kind, ...source } });
      entityId = item.id;
    }
  }
  await logAudit({ action: removing ? "websiteMedia.remove" : "websiteMedia.save", entity: "websiteMedia", entityId });
  revalidatePath(`/website/${page}`);
  return Response.json({ ok: true });
}
