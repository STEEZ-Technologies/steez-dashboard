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
  console.log("notifyNewLead: start", { tenantId: lead.tenantId });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.log("notifyNewLead: no RESEND_API_KEY, skipping");
    return;
  }

  const owner = await prisma.user.findFirst({
    where: { tenantId: lead.tenantId, role: "OWNER" },
    select: { email: true },
  });
  if (!owner) {
    console.log("notifyNewLead: no OWNER user found for tenant", lead.tenantId);
    return;
  }
  console.log("notifyNewLead: sending to", owner.email);

  const resend = new Resend(apiKey);
  const contact = lead.email ?? lead.phone ?? "no contact info";

  try {
    const result = await resend.emails.send({
      from: FROM,
      to: owner.email,
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
    console.log("notifyNewLead: resend result", JSON.stringify(result));
  } catch (err) {
    console.error("notifyNewLead failed", err);
  }
}
