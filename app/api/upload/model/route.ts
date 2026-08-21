import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getTenantFromSession } from "@/lib/tenant";
import { uploadBuffer, getPublicUrl } from "@/lib/oss";
import { sniffGlbType } from "@/lib/model-sniff";

const MAX_SIZE_BYTES = 30 * 1024 * 1024;

export async function POST(request: Request) {
  const { tenantId } = await getTenantFromSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "3D model must be under 30MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Sniff real file bytes rather than trusting the client-supplied
  // File.type — same reasoning as the image upload route.
  const sniffed = sniffGlbType(buffer);
  if (!sniffed) {
    return NextResponse.json(
      { error: "Only GLB 3D models are allowed" },
      { status: 400 },
    );
  }

  const key = `models/${tenantId}/${randomUUID()}.${sniffed.ext}`;

  await uploadBuffer(key, buffer, sniffed.mime);

  return NextResponse.json({ path: key, url: getPublicUrl(key) });
}
