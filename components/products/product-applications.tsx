"use client";

import { LocalizedRowList, type LocalizedRow } from "@/components/products/localized-row-list";
import {
  addProductApplication,
  updateProductApplication,
  removeProductApplication,
  moveProductApplication,
} from "@/app/(dashboard)/products/[id]/applications/actions";

export type ProductApplicationRow = LocalizedRow;

/** Extra "Suited to" labels on the product page, beside its use cases. */
export function ProductApplications({
  productId,
  items,
}: {
  productId: string;
  items: ProductApplicationRow[];
}) {
  return (
    <LocalizedRowList
      items={items}
      idPrefix="application"
      noun="Label"
      placeholder="Household"
      emptyText={
        <>
          No extra labels. The product page shows only its use cases under &quot;Suited to&quot;. Add
          broader ones here, e.g. &quot;Household&quot;, &quot;Commercial&quot;, &quot;Light industry&quot;.
        </>
      }
      onAdd={(data) => addProductApplication(productId, data)}
      onUpdate={(id, data) => updateProductApplication(productId, id, data)}
      onRemove={(id) => removeProductApplication(productId, id)}
      onMove={(id, direction) => moveProductApplication(productId, id, direction)}
    />
  );
}
