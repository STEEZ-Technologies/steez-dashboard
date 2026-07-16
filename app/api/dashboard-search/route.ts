import { NextResponse } from "next/server";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";

// Authenticated, tenant-scoped search for the ⌘K command palette.
export async function GET(request: Request) {
  const { tenantId } = await getTenantFromSession();
  const q = new URL(request.url).searchParams.get("q")?.trim() ?? "";
  if (!q) return NextResponse.json({ products: [], categories: [] });

  const [products, categories] = await Promise.all([
    prisma.product.findMany({
      where: {
        tenantId,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { model: { contains: q, mode: "insensitive" } },
        ],
      },
      select: { id: true, name: true, model: true },
      take: 8,
    }),
    prisma.category.findMany({
      where: { tenantId, label: { contains: q, mode: "insensitive" } },
      select: { id: true, label: true },
      take: 5,
    }),
  ]);

  return NextResponse.json({ products, categories });
}
