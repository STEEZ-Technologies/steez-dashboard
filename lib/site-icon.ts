/**
 * Where a workspace's site icon (Next's app/icon.png convention) might be,
 * in the order to try: the client's live domain first, then the STEEZ-hosted
 * copy at <slug>.steez.digital — which still answers when the client's own
 * domain is down or misconfigured. Callers try each and fall back to
 * initials / a placeholder when none loads.
 */
export function siteIconUrls(tenant: { siteUrl: string | null; slug: string }): string[] {
  const urls = [
    tenant.siteUrl ? `${tenant.siteUrl.replace(/\/$/, "")}/icon.png` : null,
    `https://${tenant.slug}.steez.digital/icon.png`,
  ].filter((u): u is string => !!u);
  return [...new Set(urls)];
}
