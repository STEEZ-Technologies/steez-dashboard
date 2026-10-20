-- Product text in French, Italian, Spanish and Japanese, and the extra
-- "Suited to" labels. Additive only: two nullable columns and a new table.

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "i18n" JSONB;

-- AlterTable
ALTER TABLE "ProductContent" ADD COLUMN "textI18n" JSONB;

-- CreateTable
CREATE TABLE "ProductApplication" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textZh" TEXT,
    "textI18n" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductApplication_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductApplication_productId_idx" ON "ProductApplication"("productId");

-- AddForeignKey
ALTER TABLE "ProductApplication" ADD CONSTRAINT "ProductApplication_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
