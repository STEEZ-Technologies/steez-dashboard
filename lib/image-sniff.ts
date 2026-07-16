// Real content sniffing for uploads — never trust the client-supplied
// File.type. SVG is deliberately excluded: it can embed <script> and is
// not needed for product photos, so it's the simplest way to close that
// stored-XSS vector rather than trying to sanitize SVG markup.
const SIGNATURES: { mime: string; ext: string; check: (b: Buffer) => boolean }[] = [
  {
    mime: "image/jpeg",
    ext: "jpg",
    check: (b) => b.length >= 3 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  },
  {
    mime: "image/png",
    ext: "png",
    check: (b) =>
      b.length >= 8 &&
      b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 &&
      b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a,
  },
  {
    mime: "image/gif",
    ext: "gif",
    check: (b) =>
      b.length >= 6 &&
      b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x38,
  },
  {
    mime: "image/webp",
    ext: "webp",
    check: (b) =>
      b.length >= 12 &&
      b.toString("ascii", 0, 4) === "RIFF" &&
      b.toString("ascii", 8, 12) === "WEBP",
  },
];

export function sniffImageType(buffer: Buffer): { mime: string; ext: string } | null {
  for (const sig of SIGNATURES) {
    if (sig.check(buffer)) return { mime: sig.mime, ext: sig.ext };
  }
  return null;
}
