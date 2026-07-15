import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

// SEED_EMAIL/SEED_PASSWORD let you seed a real login (e.g. for a fresh
// production DB) instead of the dev-only placeholder below.
const email = process.env.SEED_EMAIL || "owner@konlito.com";
const password = process.env.SEED_PASSWORD || "konlito-dev-password";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "konlito" },
    update: {},
    create: { slug: "konlito", name: "Konlito" },
  });

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.user.upsert({
    where: { email },
    update: { passwordHash },
    create: {
      tenantId: tenant.id,
      email,
      passwordHash,
      name: "Konlito Owner",
      role: "OWNER",
    },
  });

  console.log("Seeded tenant:", tenant.slug);
  console.log(`Login with ${email} / (the password you set via SEED_PASSWORD)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
