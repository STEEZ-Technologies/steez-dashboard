// Real content sniffing for GLB uploads — mirrors lib/image-sniff.ts. A
// binary glTF file starts with the 4-byte ASCII magic "glTF"
// (0x46546C67 little-endian), never trust the client-supplied File.type.
export function sniffGlbType(buffer: Buffer): { mime: string; ext: string } | null {
  if (
    buffer.length >= 4 &&
    buffer[0] === 0x67 && // 'g'
    buffer[1] === 0x6c && // 'l'
    buffer[2] === 0x54 && // 'T'
    buffer[3] === 0x46 // 'F'
  ) {
    return { mime: "model/gltf-binary", ext: "glb" };
  }
  return null;
}
