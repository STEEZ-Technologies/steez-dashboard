import bcrypt from "bcryptjs";
import { prisma } from "../lib/db";

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: "konlito" },
    update: {},
    create: { slug: "konlito", name: "Konlito" },
  });

  const passwordHash = await bcrypt.hash("konlito-dev-password", 10);

  await prisma.user.upsert({
    where: { email: "owner@konlito.com" },
    update: {},
    create: {
      tenantId: tenant.id,
      email: "owner@konlito.com",
      passwordHash,
      name: "Konlito Owner",
      role: "OWNER",
    },
  });

  console.log("Seeded tenant:", tenant.slug);
  console.log("Login with owner@konlito.com / konlito-dev-password");
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
