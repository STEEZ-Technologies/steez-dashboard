"use server";

import { headers } from "next/headers";
import { AuthError } from "next-auth";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import { signIn } from "@/lib/auth";
import { signupSchema } from "@/lib/validation";
import { checkRateLimit } from "@/lib/rate-limit";

async function clientIp(): Promise<string> {
  const h = await headers();
  const xff = h.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return h.get("x-real-ip") ?? "unknown";
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "workspace";
}

export async function signup(
  _prevState: string | undefined,
  formData: FormData,
) {
  const ip = await clientIp();
  const ok = await checkRateLimit(`signup:ip:${ip}`, { max: 5, windowMs: 10 * 60_000 });
  if (!ok) return "Too many attempts — try again in a few minutes.";

  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return parsed.error.issues[0]?.message ?? "Invalid input";
  const { code, tenantName, email, password } = parsed.data;

  const invite = await prisma.inviteCode.findUnique({ where: { code: code.trim() } });
  if (!invite) return "Invalid invite code";
  if (invite.usedAt) return "This invite code has already been used";
  if (invite.expiresAt < new Date()) return "This invite code has expired";

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return "An account with that email already exists";

  // Unique slug.
  const base = slugify(tenantName);
  let slug = base;
  let n = 2;
  while (await prisma.tenant.findUnique({ where: { slug } })) {
    slug = `${base}-${n++}`;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.$transaction([
    prisma.tenant.create({
      data: {
        slug,
        name: tenantName,
        users: { create: { email, passwordHash, role: "OWNER" } },
      },
    }),
    prisma.inviteCode.update({
      where: { id: invite.id },
      data: { usedAt: new Date(), usedByEmail: email },
    }),
  ]);

  try {
    await signIn("credentials", { email, password, redirectTo: "/" });
  } catch (error) {
    if (error instanceof AuthError) return "Account created — please sign in.";
    throw error;
  }
}
