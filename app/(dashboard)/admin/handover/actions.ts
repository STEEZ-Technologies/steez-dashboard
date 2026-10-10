"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { logAudit } from "@/lib/audit";
import {
  deployKey,
  dispatchDeploy,
  githubConfigured,
  handoverFor,
  prepareCloudflare,
  setRepoSecret,
} from "@/lib/handover";

export type TransferResult = { error: string } | { ok: true; pagesDev: string };

/**
 * The one-click handover: move a workspace's live site into the client's own
 * Cloudflare account. The client's token goes straight into the site repo's
 * encrypted Actions secrets — it is never stored here or logged.
 */
export async function transferSite(slug: string, formData: FormData): Promise<TransferResult> {
  const admin = await requireSuperAdmin();

  const cfg = handoverFor(slug);
  if (!cfg) return { error: "This workspace has no handover set up" };
  if (!githubConfigured()) return { error: "HANDOVER_GITHUB_TOKEN is not set on the dashboard" };

  const accountId = String(formData.get("accountId") ?? "").trim();
  const token = String(formData.get("apiToken") ?? "").trim();
  const goLive = formData.get("goLive") === "on";
  if (!/^[0-9a-f]{32}$/i.test(accountId)) return { error: "Account ID is 32 hex characters" };
  if (token.length < 20) return { error: "Paste the client's API token" };

  const tenant = await prisma.tenant.findUnique({
    where: { slug },
    select: { id: true, name: true, siteUrl: true },
  });
  if (!tenant) return { error: "Workspace not found" };

  const prep = await prepareCloudflare(cfg, accountId, token);
  if ("error" in prep) return prep;

  try {
    await setRepoSecret(cfg, "CLIENT_CF_ACCOUNT_ID", accountId);
    await setRepoSecret(cfg, "CLIENT_CF_API_TOKEN", token);
    await dispatchDeploy(cfg, goLive);
  } catch (error) {
    console.error("Handover failed:", error);
    return { error: error instanceof Error ? error.message : "GitHub request failed" };
  }

  // From now on Publish deploys into the client's account.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: {
      deployHookUrl: `${proto}://${host}/api/handover/${slug}/deploy?key=${deployKey(slug)}`,
      siteUrl: goLive ? cfg.siteUrl : tenant.siteUrl,
    },
  });

  await logAudit({
    action: "platform.site_handover",
    entity: "tenant",
    entityId: tenant.id,
    detail: `${tenant.name} → Cloudflare account ${accountId}${goLive ? `, live on ${cfg.domains.join(" + ")}` : ""} by ${admin.email}`,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/handover/${slug}`);
  return { ok: true, pagesDev: prep.pagesDev };
}
