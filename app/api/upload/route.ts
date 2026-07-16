import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getTenantFromSession } from "@/lib/tenant";
import { uploadBuffer, getPublicUrl } from "@/lib/oss";
import { sniffImageType } from "@/lib/image-sniff";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { tenantId } = await getTenantFromSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  // Sniff real file bytes rather than trusting the client-supplied
  // File.type — an attacker can label anything "image/svg+xml" or
  // "image/png" regardless of actual content.
  const sniffed = sniffImageType(buffer);
  if (!sniffed) {
    return NextResponse.json(
      { error: "Only JPEG, PNG, GIF, or WEBP images are allowed" },
      { status: 400 },
    );
  }

  const key = `products/${tenantId}/${randomUUID()}.${sniffed.ext}`;

  await uploadBuffer(key, buffer, sniffed.mime);

  return NextResponse.json({ path: key, url: getPublicUrl(key) });
}
