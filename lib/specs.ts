/** "Key: Value" per line <-> flat string map, for the Product.specs Json column. */

export function parseSpecsText(text: string): Record<string, string> {
  const specs: Record<string, string> = {};
  for (const line of text.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const separatorIndex = trimmed.indexOf(":");
    if (separatorIndex === -1) continue;
    const key = trimmed.slice(0, separatorIndex).trim();
    const value = trimmed.slice(separatorIndex + 1).trim();
    if (key && value) specs[key] = value;
  }
  return specs;
}

export function formatSpecsText(specs: unknown): string {
  if (!specs || typeof specs !== "object") return "";
  return Object.entries(specs as Record<string, string>)
    .map(([key, value]) => `${key}: ${value}`)
    .join("\n");
}
