-- CreateEnum
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'ARCHIVED');

-- AlterTable
-- Category gains updatedAt to drive pending-change detection for publishing.
-- Existing rows are backfilled from createdAt (not now()) so a category that
-- hasn't been touched since creation doesn't falsely read as "recently edited".
-- The default is then dropped: Prisma's @updatedAt sets it from app code.
ALTER TABLE "Category" ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
UPDATE "Category" SET "updatedAt" = "createdAt";
ALTER TABLE "Category" ALTER COLUMN "updatedAt" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "deployHookUrl" TEXT,
ADD COLUMN     "lastPublishedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "productId" TEXT,
    "name" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "message" TEXT,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "notes" TEXT,
    "sessionId" TEXT,
    "path" TEXT,
    "referrer" TEXT,
    "country" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Lead_tenantId_createdAt_idx" ON "Lead"("tenantId", "createdAt");

-- CreateIndex
CREATE INDEX "Lead_tenantId_status_idx" ON "Lead"("tenantId", "status");

-- CreateIndex
CREATE INDEX "Lead_productId_idx" ON "Lead"("productId");

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
