import { NextResponse } from "next/server";
import { runRetention } from "@/lib/retention";

export const maxDuration = 60;

/**
 * Deletes analytics, rate-limit rows and backups past their retention (see
 * lib/retention.ts). Triggered by Vercel Cron (vercel.json), signed with
 * `Authorization: Bearer $CRON_SECRET` like the backup job.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runRetention();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Retention failed:", error);
    return NextResponse.json({ ok: false, error: "Retention failed" }, { status: 500 });
  }
}
