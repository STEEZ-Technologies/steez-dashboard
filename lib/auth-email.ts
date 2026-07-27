import "server-only";
import { Resend } from "resend";

const FROM = "STEEZ Dashboard <alerts@steez.digital>";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return; // not configured — request still succeeds silently

  const resend = new Resend(apiKey);
  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: "Reset your STEEZ Dashboard password",
      text: [
        "Someone requested a password reset for your STEEZ Dashboard account.",
        "",
        `Reset it here (expires in 1 hour): ${resetUrl}`,
        "",
        "If you didn't request this, you can ignore this email.",
      ].join("\n"),
    });
  } catch (err) {
    console.error("sendPasswordResetEmail failed", err);
  }
}
