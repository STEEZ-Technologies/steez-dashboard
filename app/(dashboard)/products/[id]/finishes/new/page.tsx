import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { FinishForm } from "@/components/products/FinishForm";
import { PageHeader } from "@/components/shell/page-header";
import { createFinish } from "../actions";

export default async function NewFinishPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { tenantId } = await getTenantFromSession();
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) notFound();

  return (
    <div>
      <PageHeader eyebrow={product.name} title="Add finish" />
      <FinishForm action={createFinish.bind(null, product.id)} submitLabel="Add finish" />
    </div>
  );
}
