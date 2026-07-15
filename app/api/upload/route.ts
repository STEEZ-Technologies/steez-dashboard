import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { getTenantFromSession } from "@/lib/tenant";
import { uploadBuffer, getPublicUrl } from "@/lib/oss";

const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export async function POST(request: Request) {
  const { tenantId } = await getTenantFromSession();

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json(
      { error: "Only image uploads are allowed" },
      { status: 400 },
    );
  }
  if (file.size > MAX_SIZE_BYTES) {
    return NextResponse.json(
      { error: "Image must be under 5MB" },
      { status: 400 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const ext = file.name.split(".").pop() || "jpg";
  const key = `products/${tenantId}/${randomUUID()}.${ext}`;

  await uploadBuffer(key, buffer, file.type);

  return NextResponse.json({ path: key, url: getPublicUrl(key) });
}
