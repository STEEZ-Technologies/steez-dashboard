import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import sodium from "libsodium-wrappers";

// Handing a client's site over to hosting in their OWN Cloudflare account.
//
// The site's repo carries a workflow (.github/workflows/deploy-client.yml)
// that builds it and deploys it into whatever account its two secrets name.
// The handover page writes those secrets with the client's token, creates
// their Pages project, and starts the workflow; afterwards the workspace's
// deploy hook points at /api/handover/<slug>/deploy, so Publish keeps working
// — it now starts the same workflow instead of STEEZ's Pages build.
//
// Needs HANDOVER_GITHUB_TOKEN: a fine-grained token on the site repo with
// Actions (read & write) and Secrets (read & write).

export type HandoverConfig = {
  repo: string; // owner/name
  workflow: string; // file name under .github/workflows
  ref: string;
  project: string; // Pages project name in the client's account
  domains: string[]; // apex first
  siteUrl: string;
};

const HANDOVERS: Record<string, HandoverConfig> = {
  komibright: {
    repo: "STEEZ-Technologies/komibright-v2",
    workflow: "deploy-client.yml",
    ref: "main",
    project: "komibright",
    domains: ["komibright.com", "www.komibright.com"],
    siteUrl: "https://komibright.com",
  },
};

export function handoverFor(slug: string): HandoverConfig | null {
  return HANDOVERS[slug] ?? null;
}

export function githubConfigured(): boolean {
  return Boolean(process.env.HANDOVER_GITHUB_TOKEN);
}

/** Whether the dashboard's public API will accept calls from the new domain. */
export function originsReady(cfg: HandoverConfig): boolean {
  const allowed = (process.env.PUBLIC_ALLOWED_ORIGINS ?? "").split(",").map((o) => o.trim());
  return cfg.domains.every((d) => allowed.includes(`https://${d}`));
}

// ── Deploy-hook key ──────────────────────────────────────────────────────
// The Publish button POSTs to a bare URL, so the URL itself is the
// credential: an HMAC of the slug under AUTH_SECRET.

export function deployKey(slug: string): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set");
  return createHmac("sha256", secret).update(`handover:${slug}`).digest("hex");
}

export function deployKeyValid(slug: string, key: string | null): boolean {
  if (!key) return false;
  const want = Buffer.from(deployKey(slug));
  const got = Buffer.from(key);
  return want.length === got.length && timingSafeEqual(want, got);
}

// ── Cloudflare (client's account) ────────────────────────────────────────

const CF = "https://api.cloudflare.com/client/v4";

async function cf(token: string, method: string, path: string, body?: unknown) {
  const res = await fetch(CF + path, {
    method,
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
  const json = (await res.json().catch(() => ({}))) as {
    success?: boolean;
    result?: unknown;
    errors?: { message: string }[];
  };
  return { ok: res.ok && json.success !== false, status: res.status, json };
}

function cfError(r: Awaited<ReturnType<typeof cf>>) {
  return r.json.errors?.map((e) => e.message).join("; ") || `HTTP ${r.status}`;
}

/**
 * Check the client's token can do everything the workflow will ask of it,
 * and create their Pages project. Returns an error message, or the
 * project's pages.dev address.
 */
export async function prepareCloudflare(
  cfg: HandoverConfig,
  accountId: string,
  token: string,
): Promise<{ error: string } | { pagesDev: string }> {
  const verify = await cf(token, "GET", "/user/tokens/verify");
  if (!verify.ok) return { error: `Cloudflare rejected the token: ${cfError(verify)}` };

  const apex = cfg.domains[0];
  const zones = await cf(token, "GET", `/zones?name=${apex}&account.id=${accountId}`);
  if (!zones.ok) return { error: `Can't read zones: ${cfError(zones)} — token needs Zone › Zone › Read` };
  const zone = (zones.json.result as { id: string }[])[0];
  if (!zone) return { error: `${apex} isn't in that Cloudflare account, or the token can't see it` };

  const dns = await cf(token, "GET", `/zones/${zone.id}/dns_records?per_page=1`);
  if (!dns.ok) return { error: `Can't read ${apex}'s DNS: ${cfError(dns)} — token needs Zone › DNS › Edit` };

  const path = `/accounts/${accountId}/pages/projects/${cfg.project}`;
  let project = await cf(token, "GET", path);
  if (!project.ok && project.status === 404) {
    project = await cf(token, "POST", `/accounts/${accountId}/pages/projects`, {
      name: cfg.project,
      production_branch: "main",
    });
  }
  if (!project.ok) {
    return { error: `Can't create the Pages project: ${cfError(project)} — token needs Account › Cloudflare Pages › Edit` };
  }
  return { pagesDev: (project.json.result as { subdomain: string }).subdomain };
}

// ── GitHub (site repo) ───────────────────────────────────────────────────

async function gh(method: string, path: string, body?: unknown) {
  return fetch(`https://api.github.com${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.HANDOVER_GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
      "Content-Type": "application/json",
    },
    body: body ? JSON.stringify(body) : undefined,
    cache: "no-store",
  });
}

/** Write an Actions secret — GitHub only accepts it sealed to the repo's key. */
export async function setRepoSecret(cfg: HandoverConfig, name: string, value: string) {
  const keyRes = await gh("GET", `/repos/${cfg.repo}/actions/secrets/public-key`);
  if (!keyRes.ok) throw new Error(`GitHub public key: HTTP ${keyRes.status}`);
  const { key, key_id } = (await keyRes.json()) as { key: string; key_id: string };

  await sodium.ready;
  const sealed = sodium.crypto_box_seal(
    sodium.from_string(value),
    sodium.from_base64(key, sodium.base64_variants.ORIGINAL),
  );
  const res = await gh("PUT", `/repos/${cfg.repo}/actions/secrets/${name}`, {
    encrypted_value: sodium.to_base64(sealed, sodium.base64_variants.ORIGINAL),
    key_id,
  });
  if (!res.ok) throw new Error(`GitHub secret ${name}: HTTP ${res.status}`);
}

export async function dispatchDeploy(cfg: HandoverConfig, goLive: boolean) {
  const res = await gh("POST", `/repos/${cfg.repo}/actions/workflows/${cfg.workflow}/dispatches`, {
    ref: cfg.ref,
    inputs: { go_live: goLive ? "true" : "false" },
  });
  if (!res.ok) throw new Error(`GitHub workflow dispatch: HTTP ${res.status}`);
}

export type DeployRun = {
  status: string; // queued | in_progress | completed
  conclusion: string | null; // success | failure | cancelled …
  createdAt: string;
  url: string;
};

export async function recentRuns(cfg: HandoverConfig, limit = 5): Promise<DeployRun[]> {
  if (!githubConfigured()) return [];
  const res = await gh(
    "GET",
    `/repos/${cfg.repo}/actions/workflows/${cfg.workflow}/runs?per_page=${limit}`,
  );
  if (!res.ok) return [];
  const json = (await res.json()) as {
    workflow_runs: {
      status: string;
      conclusion: string | null;
      created_at: string;
      html_url: string;
    }[];
  };
  return json.workflow_runs.map((r) => ({
    status: r.status,
    conclusion: r.conclusion,
    createdAt: r.created_at,
    url: r.html_url,
  }));
}
