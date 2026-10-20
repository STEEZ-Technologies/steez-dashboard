"use client";

import { LocalizedRowList, type LocalizedRow } from "@/components/products/localized-row-list";
import {
  addProductContent,
  updateProductContent,
  removeProductContent,
  moveProductContent,
} from "@/app/(dashboard)/products/[id]/content/actions";

export type ProductContentRow = LocalizedRow;

export function ProductContent({
  productId,
  items,
}: {
  productId: string;
  items: ProductContentRow[];
}) {
  return (
    <LocalizedRowList
      items={items}
      idPrefix="content"
      noun="Item"
      placeholder="1x membrane housing"
      emptyText={
        <>
          No box contents listed yet — e.g. &quot;1x membrane housing&quot;, &quot;2x mounting brackets&quot;.
        </>
      }
      onAdd={(data) => addProductContent(productId, data)}
      onUpdate={(id, data) => updateProductContent(productId, id, data)}
      onRemove={(id) => removeProductContent(productId, id)}
      onMove={(id, direction) => moveProductContent(productId, id, direction)}
    />
  );
}
