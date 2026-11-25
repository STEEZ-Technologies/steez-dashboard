import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";

export async function GET(request: Request, { params }: { params: Promise<{id: string}> }) {
  const { tenantId } = await getTenantFromSession();
  const { id } = await params;
  const media = await prisma.websiteMedia.findFirst({ where: { id, tenantId }, select: { file: true, mime: true } });
  if (!media?.file || !media.mime) return new Response(null, { status: 404 });
  const bytes = media.file;
  const headers = new Headers({ "Content-Type": media.mime, "Cache-Control": "private, no-store", "Accept-Ranges": "bytes", "X-Content-Type-Options": "nosniff" });
  const range = request.headers.get("range");
  if (range) {
    const match = /^bytes=(\d+)-(\d*)$/.exec(range);
    const start = Number(match?.[1]), end = Math.min(Number(match?.[2] || bytes.length - 1), bytes.length - 1);
    if (!match || start > end) return new Response(null, { status: 416, headers: { "Content-Range": `bytes */${bytes.length}` } });
    headers.set("Content-Range", `bytes ${start}-${end}/${bytes.length}`);
    return new Response(new Uint8Array(bytes.slice(start,end+1)), { status: 206, headers });
  }
  return new Response(new Uint8Array(bytes), { headers });
}
