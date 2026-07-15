import { notFound } from "next/navigation";
import { getTenantFromSession } from "@/lib/tenant";
import { prisma } from "@/lib/db";
import { FinishForm } from "@/components/products/FinishForm";
import { PageHeader } from "@/components/shell/page-header";
import { getPublicUrl } from "@/lib/oss";
import { updateFinish } from "../../actions";

export default async function EditFinishPage({
  params,
}: {
  params: Promise<{ id: string; finishId: string }>;
}) {
  const { id, finishId } = await params;
  const { tenantId } = await getTenantFromSession();
  const product = await prisma.product.findFirst({ where: { id, tenantId } });
  if (!product) notFound();

  const finish = await prisma.productFinish.findFirst({
    where: { id: finishId, productId: product.id },
  });
  if (!finish) notFound();

  return (
    <div>
      <PageHeader eyebrow={product.name} title="Edit finish" />
      <FinishForm
        action={updateFinish.bind(null, product.id, finish.id)}
        submitLabel="Save changes"
        defaultImageUrl={getPublicUrl(finish.imagePath)}
        defaultValues={{
          key: finish.key,
          materialLabel: finish.materialLabel,
          accentHex: finish.accentHex,
          imagePath: finish.imagePath,
        }}
      />
    </div>
  );
}
