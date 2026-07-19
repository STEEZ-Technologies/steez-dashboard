import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

/**
 * Break-glass password reset.
 *
 * Recovery path for when nobody can get into a workspace through the app —
 * the sole OWNER is locked out, or a client lost their credentials and there
 * is no email service to send a reset link.
 *
 * Deliberately a CLI script and NOT a web route: it requires direct database
 * access, so it can't be reached or brute-forced from the internet. Run it
 * against production by passing that DATABASE_URL explicitly.
 *
 *   # list every account (no changes made)
 *   DATABASE_URL="postgresql://…" npx tsx prisma/reset-password.ts
 *
 *   # reset one account
 *   DATABASE_URL="postgresql://…" RESET_EMAIL="owner@client.com" \
 *     RESET_PASSWORD="a-strong-passphrase" npx tsx prisma/reset-password.ts
 *
 * Prefer /admin in the dashboard when you can still sign in — this exists for
 * when you can't.
 */

const email = process.env.RESET_EMAIL;
const password = process.env.RESET_PASSWORD;

async function listUsers() {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "asc" },
    select: {
      email: true,
      role: true,
      createdAt: true,
      tenant: { select: { slug: true, name: true } },
    },
  });

  if (users.length === 0) {
    console.log("No users found. Is DATABASE_URL pointing at the right database?");
    return;
  }

  console.log(`\n${users.length} account(s):\n`);
  for (const u of users) {
    console.log(
      `  ${u.email.padEnd(32)} ${u.role.padEnd(6)} ${u.tenant.name} (${u.tenant.slug})`,
    );
  }
  console.log(
    "\nTo reset one, re-run with RESET_EMAIL and RESET_PASSWORD set. See the header of this file.\n",
  );
}

async function main() {
  if (!email || !password) {
    await listUsers();
    return;
  }

  if (password.length < 8) {
    throw new Error("RESET_PASSWORD must be at least 8 characters");
  }

  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
    select: { id: true, email: true, role: true, tenant: { select: { slug: true } } },
  });
  if (!user) {
    throw new Error(
      `No account with email "${email}". Run without RESET_EMAIL to list all accounts.`,
    );
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

  // Recorded so an out-of-band reset is still visible in the workspace's
  // activity log — this bypasses the app's own auth, so it must leave a trace.
  await prisma.auditLog.create({
    data: {
      tenantId: (
        await prisma.user.findUniqueOrThrow({
          where: { id: user.id },
          select: { tenantId: true },
        })
      ).tenantId,
      userEmail: "cli:reset-password",
      action: "account.password_reset_cli",
      entity: "user",
      entityId: user.id,
      detail: user.email,
    },
  });

  console.log(
    `\nPassword reset for ${user.email} (${user.role}, workspace "${user.tenant.slug}").\n` +
      `Share it over a secure channel and have them change it in Settings.\n`,
  );
}

main()
  .catch((e) => {
    console.error(`\n${e instanceof Error ? e.message : e}\n`);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
