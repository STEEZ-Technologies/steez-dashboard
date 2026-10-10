/** The 11-character id YouTube gives every video, Shorts included. */
const ID = /^[\w-]{11}$/;

/**
 * Reads a YouTube video out of whatever link the client pastes — a watch
 * page, a youtu.be share link, a Short, an embed, a mobile or music link — or
 * a bare id. `short` is true only when the link itself says /shorts/; a Short
 * shared as a watch link is told apart by the form's own switch.
 */
export function parseYouTube(input: string): { id: string; short: boolean } | null {
  const raw = input.trim();
  if (ID.test(raw)) return { id: raw, short: false };

  let url: URL;
  try {
    url = new URL(/^https?:\/\//i.test(raw) ? raw : `https://${raw}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^(www|m|music)\./, "");
  const parts = url.pathname.split("/").filter(Boolean);
  let id: string | undefined;
  let short = false;

  if (host === "youtu.be") {
    id = parts[0];
  } else if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (parts[0] === "watch") id = url.searchParams.get("v") ?? undefined;
    else if (["shorts", "embed", "live", "v"].includes(parts[0])) {
      id = parts[1];
      short = parts[0] === "shorts";
    }
  }

  return id && ID.test(id) ? { id, short } : null;
}

export function youTubeUrl(id: string, short: boolean) {
  return short ? `https://www.youtube.com/shorts/${id}` : `https://www.youtube.com/watch?v=${id}`;
}
