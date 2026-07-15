import "server-only";
import OSS from "ali-oss";

let client: OSS | undefined;

function getClient(): OSS {
  if (!client) {
    client = new OSS({
      region: process.env.OSS_REGION!,
      accessKeyId: process.env.OSS_ACCESS_KEY_ID!,
      accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET!,
      bucket: process.env.OSS_BUCKET!,
    });
  }
  return client;
}

export async function uploadBuffer(
  key: string,
  buffer: Buffer,
  contentType: string,
): Promise<void> {
  await getClient().put(key, buffer, { mime: contentType });
}

export function getPublicUrl(key: string): string {
  // Absolute URLs (e.g. imported from Konlito's own site, pre-OSS-migration)
  // pass through unchanged — only relative OSS keys get the bucket base.
  if (/^https?:\/\//.test(key)) return key;
  const base = process.env.ASSET_BASE_URL ?? "";
  return `${base.replace(/\/$/, "")}/${key}`;
}
