"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { prisma } from "@/lib/db";
import { requireSuperAdmin } from "@/lib/super-admin";
import { logAudit } from "@/lib/audit";
import {
  checkAliyun,
  deployKey,
  dispatchDeploy,
  githubConfigured,
  handoverFor,
  onAliyunDns,
  setRepoSecret,
} from "@/lib/handover";

/**
 * Step 1 of the handover: upload the site into the client's own Alibaba
 * Cloud account and move the domain's DNS there, records copied first so
 * nothing visible changes. The AccessKey goes straight into the site repo's
 * encrypted Actions secrets — it is never stored here or logged.
 */
export async function transferSite(slug: string, formData: FormData): Promise<string | undefined> {
  const admin = await requireSuperAdmin();

  const cfg = handoverFor(slug);
  if (!cfg) return "This workspace has no handover set up";
  if (!githubConfigured()) return "HANDOVER_GITHUB_TOKEN is not set on the dashboard";

  const akId = String(formData.get("akId") ?? "").trim();
  const akSecret = String(formData.get("akSecret") ?? "").trim();
  if (!/^LTAI[0-9A-Za-z]{12,}$/.test(akId)) return "An AccessKey ID starts with LTAI";
  if (akSecret.length < 20) return "Paste the AccessKey secret";

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!tenant) return "Workspace not found";

  const problem = await checkAliyun(cfg, akId, akSecret);
  if (problem) return problem;

  try {
    await setRepoSecret(cfg, "CLIENT_ALIYUN_AK_ID", akId);
    await setRepoSecret(cfg, "CLIENT_ALIYUN_AK_SECRET", akSecret);
    await dispatchDeploy(cfg, "handover");
  } catch (error) {
    console.error("Handover failed:", error);
    return error instanceof Error ? error.message : "GitHub request failed";
  }

  // From now on Publish uploads into the client's account.
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host");
  const proto = h.get("x-forwarded-proto") ?? "https";
  await prisma.tenant.update({
    where: { id: tenant.id },
    data: { deployHookUrl: `${proto}://${host}/api/handover/${slug}/deploy?key=${deployKey(slug)}` },
  });

  await logAudit({
    action: "platform.site_handover",
    entity: "tenant",
    entityId: tenant.id,
    detail: `${tenant.name} → Alibaba Cloud (AccessKey ${akId.slice(0, 8)}…) by ${admin.email}`,
  });

  revalidatePath("/admin");
  revalidatePath(`/admin/handover/${slug}`);
  return undefined;
}

/**
 * Step 2: point the domains at the new site. Only once the domain resolves
 * through Alibaba Cloud DNS — before that, the records go-live writes would
 * sit in a zone nobody asks.
 */
export async function goLive(slug: string): Promise<string | undefined> {
  const admin = await requireSuperAdmin();

  const cfg = handoverFor(slug);
  if (!cfg) return "This workspace has no handover set up";
  if (!githubConfigured()) return "HANDOVER_GITHUB_TOKEN is not set on the dashboard";
  if (!(await onAliyunDns(cfg)).aliyun) return `${cfg.domains[0]} doesn't answer from Alibaba Cloud DNS yet`;

  const tenant = await prisma.tenant.findUnique({ where: { slug }, select: { id: true, name: true } });
  if (!tenant) return "Workspace not found";

  try {
    await dispatchDeploy(cfg, "go_live");
  } catch (error) {
    console.error("Go-live failed:", error);
    return error instanceof Error ? error.message : "GitHub request failed";
  }

  await prisma.tenant.update({ where: { id: tenant.id }, data: { siteUrl: cfg.siteUrl } });
  await logAudit({
    action: "platform.site_go_live",
    entity: "tenant",
    entityId: tenant.id,
    detail: `${tenant.name} live on ${cfg.domains.join(" + ")} by ${admin.email}`,
  });

  revalidatePath("/", "layout");
  return undefined;
}
