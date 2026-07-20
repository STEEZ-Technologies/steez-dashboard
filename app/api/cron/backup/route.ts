import { NextResponse } from "next/server";
import { runBackup } from "@/lib/backup";

export const maxDuration = 60;

/**
 * Triggered by Vercel Cron (see vercel.json). Vercel signs the request with
 * `Authorization: Bearer $CRON_SECRET` when that env var is set — verify it
 * so this endpoint can't be hit by anyone who finds the URL.
 */
export async function GET(request: Request) {
  const auth = request.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await runBackup();
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    console.error("Backup failed:", error);
    return NextResponse.json({ ok: false, error: "Backup failed" }, { status: 500 });
  }
}
