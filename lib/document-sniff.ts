import { sniffImageType } from "@/lib/image-sniff";

// Real content sniffing for document uploads — mirrors lib/image-sniff.ts.
// A certificate is a PDF, or a scan sent as a photo: a PDF starts with the
// ASCII "%PDF-"; a scan has to be a JPEG or PNG a browser opens in a tab.
// Never trust the client-supplied File.type.
export function sniffDocumentType(buffer: Buffer): { mime: string; ext: string } | null {
  if (
    buffer.length >= 5 &&
    buffer[0] === 0x25 && // '%'
    buffer[1] === 0x50 && // 'P'
    buffer[2] === 0x44 && // 'D'
    buffer[3] === 0x46 && // 'F'
    buffer[4] === 0x2d // '-'
  ) {
    return { mime: "application/pdf", ext: "pdf" };
  }
  const image = sniffImageType(buffer);
  if (image && (image.ext === "jpg" || image.ext === "png")) return image;
  return null;
}
