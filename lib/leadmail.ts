import { Resend } from "resend";
import { prisma } from "@/lib/db";

const FROM = "STEEZ Dashboard <alerts@steez.digital>";

/**
 * Fire-and-forget: a lead notification failing must never block lead capture
 * (the buyer-facing POST already succeeded and wrote the row).
 */
export async function notifyNewLead(lead: {
  tenantId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  message?: string | null;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // not configured yet — skip silently

  // LEAD_ALERT_EMAIL overrides the tenant owner's email — the owner record on
  // file (e.g. owner@konlito.com) is a placeholder, not a real inbox.
  const to =
    process.env.LEAD_ALERT_EMAIL ??
    (
      await prisma.user.findFirst({
        where: { tenantId: lead.tenantId, role: "OWNER" },
        select: { email: true },
      })
    )?.email;
  if (!to) return;

  const resend = new Resend(apiKey);
  const contact = lead.email ?? lead.phone ?? "no contact info";

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: `New enquiry: ${lead.name ?? contact}`,
      text: [
        `Name: ${lead.name ?? "—"}`,
        `Email: ${lead.email ?? "—"}`,
        `Phone: ${lead.phone ?? "—"}`,
        `Company: ${lead.company ?? "—"}`,
        "",
        lead.message ?? "(no message)",
        "",
        "https://dashboard.steez.digital/leads",
      ].join("\n"),
    });
  } catch (err) {
    console.error("notifyNewLead failed", err);
  }
}
