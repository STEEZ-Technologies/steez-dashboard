-- Interactive rotate/spin GLB viewer support on the product page.
CREATE TABLE "ProductModel3D" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "modelPath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductModel3D_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "ProductModel3D_productId_idx" ON "ProductModel3D"("productId");

ALTER TABLE "ProductModel3D" ADD CONSTRAINT "ProductModel3D_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
