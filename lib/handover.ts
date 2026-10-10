import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import sodium from "libsodium-wrappers";

// Handing a client's site over to hosting in their OWN Alibaba Cloud account.
//
// The site's repo carries a workflow (.github/workflows/deploy-client.yml)
// that builds it and uploads it to an OSS bucket in whatever account its two
// secrets name. The handover page writes those secrets with the client's
// AccessKey and starts the workflow in two steps:
//
//   handover  upload, then move the domain's DNS to Alibaba Cloud DNS with
//             today's records copied first — nothing visible changes
//   go_live   once the domain answers from Alibaba Cloud DNS: CDN in front of
//             the bucket, free certificate, domains pointed at it
//
// Afterwards the workspace's deploy hook points at
// /api/handover/<slug>/deploy, so Publish keeps working — it runs the
// workflow's `publish` step instead of STEEZ's Pages build.
//
// Needs HANDOVER_GITHUB_TOKEN: a fine-grained token on the site repo with
// Actions (read & write) and Secrets (read & write).

export type HandoverConfig = {
  repo: string; // owner/name
  workflow: string; // file name under .github/workflows
  ref: string;
  domains: string[]; // apex first
  siteUrl: string;
};

export type DeployStep = "publish" | "handover" | "go_live";

const HANDOVERS: Record<string, HandoverConfig> = {
  komibright: {
    repo: "STEEZ-Technologies/komibright-v2",
    workflow: "deploy-client.yml",
    ref: "main",
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

// ── Alibaba Cloud (client's account) ─────────────────────────────────────
// RPC signature v1 — the same signer as the site repo's
// scripts/client-aliyun.mjs, which does the actual work.

const PRODUCTS = {
  dns: ["alidns.aliyuncs.com", "2015-01-09"],
  cdn: ["cdn.aliyuncs.com", "2018-05-10"],
  domain: ["domain.aliyuncs.com", "2018-01-29"],
} as const;

const enc = (s: string) =>
  encodeURIComponent(s).replace(/[!'()*]/g, (c) => "%" + c.charCodeAt(0).toString(16).toUpperCase());

async function rpc(
  akId: string,
  akSecret: string,
  product: keyof typeof PRODUCTS,
  action: string,
  params: Record<string, string> = {},
): Promise<{ ok: true; json: Record<string, unknown> } | { ok: false; code: string; message: string }> {
  const [host, version] = PRODUCTS[product];
  const all: Record<string, string> = {
    Format: "JSON",
    Version: version,
    AccessKeyId: akId,
    SignatureMethod: "HMAC-SHA1",
    SignatureVersion: "1.0",
    SignatureNonce: randomUUID(),
    Timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, "Z"),
    Action: action,
    ...params,
  };
  const query = Object.keys(all)
    .sort()
    .map((k) => `${enc(k)}=${enc(all[k])}`)
    .join("&");
  const sig = createHmac("sha1", `${akSecret}&`).update(`GET&%2F&${enc(query)}`).digest("base64");
  const res = await fetch(`https://${host}/?${query}&Signature=${enc(sig)}`, { cache: "no-store" });
  const json = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  if (!res.ok) return { ok: false, code: String(json.Code ?? res.status), message: String(json.Message ?? "") };
  return { ok: true, json };
}

/**
 * Check the client's AccessKey can do everything the workflow will ask of
 * it, before anything is stored or started. Returns an error message or null.
 */
export async function checkAliyun(
  cfg: HandoverConfig,
  akId: string,
  akSecret: string,
): Promise<string | null> {
  const apex = cfg.domains[0];
  const missing = (policy: string) => `the RAM user needs ${policy}`;

  const dns = await rpc(akId, akSecret, "dns", "DescribeDomains", { PageSize: "1" });
  if (!dns.ok) {
    if (/InvalidAccessKeyId|SignatureDoesNotMatch/.test(dns.code)) return "Alibaba Cloud rejected that AccessKey";
    return `DNS: ${dns.code} — ${missing("AliyunDNSFullAccess")}`;
  }
  const cdn = await rpc(akId, akSecret, "cdn", "DescribeUserDomains", { PageSize: "1" });
  if (!cdn.ok) return `CDN: ${cdn.code} — ${missing("AliyunCDNFullAccess")}`;
  const domain = await rpc(akId, akSecret, "domain", "QueryDomainByDomainName", { DomainName: apex });
  if (!domain.ok) {
    return `Domain: ${domain.code} — ${apex} must be registered in this Alibaba Cloud account, and ${missing("AliyunDomainFullAccess")}`;
  }
  // OSS has no RPC API; a bucket listing proves the permission.
  const OSS = (await import("ali-oss")).default;
  try {
    await new OSS({ region: "oss-cn-hongkong", accessKeyId: akId, accessKeySecret: akSecret }).listBuckets({
      "max-keys": "1",
    });
  } catch (e) {
    return `OSS: ${(e as { code?: string }).code ?? "error"} — ${missing("AliyunOSSFullAccess")}`;
  }
  return null;
}

/** Whether the public internet already resolves the domain through Alibaba Cloud DNS. */
export async function onAliyunDns(cfg: HandoverConfig): Promise<{ aliyun: boolean; servers: string[] }> {
  try {
    const res = await fetch(`https://dns.alidns.com/resolve?name=${cfg.domains[0]}&type=NS`, {
      cache: "no-store",
    });
    const json = (await res.json()) as { Answer?: { type: number; data: string }[] };
    const servers = (json.Answer ?? []).filter((a) => a.type === 2).map((a) => a.data.replace(/\.$/, ""));
    return {
      aliyun: servers.length > 0 && servers.every((s) => /(hichina|alidns)\.com$/i.test(s)),
      servers,
    };
  } catch {
    return { aliyun: false, servers: [] };
  }
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

export async function dispatchDeploy(cfg: HandoverConfig, step: DeployStep) {
  const res = await gh("POST", `/repos/${cfg.repo}/actions/workflows/${cfg.workflow}/dispatches`, {
    ref: cfg.ref,
    inputs: { step },
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
