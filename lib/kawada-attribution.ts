const KAWADA_HOST = "kawada.steez.digital";

export function kawadaSource(value: unknown, origin?: string | null): string | null {
  if (typeof value !== "string" || value.length > 500) return null;
  try {
    const url = new URL(value.includes("://") ? value : `https://${value}`);
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    const host = url.hostname.toLowerCase().replace(/^www\./, "").replace(/\.$/, "");
    const ownHost = origin ? new URL(origin).hostname.replace(/^www\./, "") : null;
    if (!/^(?:[a-z0-9-]+\.)+[a-z0-9-]+$/.test(host) || host === ownHost || host === KAWADA_HOST) {
      return null;
    }
    return host;
  } catch {
    return null;
  }
}

export function kawadaPath(value: unknown): string | undefined {
  if (typeof value !== "string") return;
  const path = value.split(/[?#]/, 1)[0];
  if (/^\/[a-z0-9/_-]*$/i.test(path) && !path.includes("//") && path.length <= 500) return path;
}

export function kawadaVisitId(value: unknown): string | undefined {
  if (typeof value === "string" && /^[a-f0-9]{8}-[a-f0-9]{4}-4[a-f0-9]{3}-[89ab][a-f0-9]{3}-[a-f0-9]{12}$/.test(value)) {
    return value;
  }
}
