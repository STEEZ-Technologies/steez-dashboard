import { Resend } from "resend";
import { prisma } from "@/lib/db";
import { splitEmails } from "@/lib/validation";

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

  // The addresses the client chose in Settings come first. Without them,
  // LEAD_ALERT_EMAIL stands in for the owner's login email, which on some
  // workspaces (owner@konlito.com) is a placeholder rather than an inbox.
  // When the client has chosen, LEAD_ALERT_EMAIL still gets a blind copy, so
  // STEEZ keeps seeing enquiries without its address showing in theirs.
  const tenant = await prisma.tenant.findUnique({
    where: { id: lead.tenantId },
    select: { leadAlertEmails: true },
  });
  const chosen = splitEmails(tenant?.leadAlertEmails ?? "");
  const steez = process.env.LEAD_ALERT_EMAIL;
  const to = chosen.length
    ? chosen
    : steez
      ? [steez]
      : [
          (
            await prisma.user.findFirst({
              where: { tenantId: lead.tenantId, role: "OWNER" },
              select: { email: true },
            })
          )?.email,
        ].filter((e): e is string => Boolean(e));
  if (!to.length) return;
  const bcc = chosen.length && steez && !chosen.includes(steez.toLowerCase()) ? [steez] : undefined;

  const resend = new Resend(apiKey);
  const contact = lead.email ?? lead.phone ?? "no contact info";

  try {
    await resend.emails.send({
      from: FROM,
      to,
      bcc,
      // Reply from the inbox and it goes to the buyer, not to STEEZ.
      ...(lead.email && { replyTo: lead.email }),
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
