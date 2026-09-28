/**
 * Create STEEZ's own workspace and its first login, separate from every
 * client tenant. Idempotent — re-running only resets the password.
 *
 * The email must also be listed in SUPER_ADMIN_EMAILS for platform access
 * (lib/super-admin.ts); this script does not grant that.
 *
 * Run: STEEZ_PASSWORD="..." npx tsx prisma/seed-steez.ts
 *      (STEEZ_EMAIL defaults to adam@steez.digital)
 */
import "dotenv/config";
import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

const PLATFORM_TENANT_SLUG = "steez"; // mirrors lib/super-admin.ts (server-only)

const email = (process.env.STEEZ_EMAIL || "adam@steez.digital").toLowerCase();
const password = process.env.STEEZ_PASSWORD;

async function main() {
  if (!password || password.length < 8) {
    throw new Error("Set STEEZ_PASSWORD (8+ characters)");
  }

  const tenant = await prisma.tenant.upsert({
    where: { slug: PLATFORM_TENANT_SLUG },
    update: {},
    create: { slug: PLATFORM_TENANT_SLUG, name: "STEEZ" },
  });

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing && existing.tenantId !== tenant.id) {
    throw new Error(`${email} already belongs to another workspace`);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      name: "STEEZ",
      role: "OWNER",
    },
  });

  console.log(`STEEZ workspace ready — login ${email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
