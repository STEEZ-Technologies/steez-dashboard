import { getPublicUrl } from "@/lib/oss";

/** Where a document's file opens. A path starting with "/" is a file the
    client's site already serves (kept from before the dashboard had
    documents), so it opens on that site; anything else is an OSS key. */
export function documentUrl(filePath: string, siteUrl: string | null) {
  if (/^https?:\/\//.test(filePath)) return filePath;
  if (filePath.startsWith("/")) return siteUrl ? `${siteUrl.replace(/\/$/, "")}${filePath}` : filePath;
  return getPublicUrl(filePath);
}
