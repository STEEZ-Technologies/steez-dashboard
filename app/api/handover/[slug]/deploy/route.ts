import { NextResponse } from "next/server";
import { deployKeyValid, dispatchDeploy, githubConfigured, handoverFor } from "@/lib/handover";

/**
 * The deploy hook of a workspace whose site has been handed over to the
 * client's own Alibaba Cloud account (see lib/handover.ts). Publish POSTs here
 * exactly as it would to a Pages deploy hook; this starts the repo's
 * deploy-client workflow, which rebuilds and uploads into their account.
 * Only ever the `publish` step — DNS is changed from /admin/handover alone.
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const cfg = handoverFor(slug);
  const key = new URL(request.url).searchParams.get("key");
  if (!cfg || !deployKeyValid(slug, key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!githubConfigured()) {
    return NextResponse.json({ error: "HANDOVER_GITHUB_TOKEN is not set" }, { status: 503 });
  }

  try {
    await dispatchDeploy(cfg, "publish");
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Handover deploy failed:", error);
    return NextResponse.json({ ok: false }, { status: 502 });
  }
}
