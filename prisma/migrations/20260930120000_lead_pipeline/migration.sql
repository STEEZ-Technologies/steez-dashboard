-- AlterEnum
ALTER TYPE "LeadStatus" ADD VALUE 'QUOTED';
ALTER TYPE "LeadStatus" ADD VALUE 'WON';
ALTER TYPE "LeadStatus" ADD VALUE 'LOST';

-- AlterTable
ALTER TABLE "Lead" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "dealCurrency" TEXT,
ADD COLUMN     "dealValue" DECIMAL(14,2);

-- CreateIndex
CREATE INDEX "PageView_tenantId_sessionId_idx" ON "PageView"("tenantId", "sessionId");

-- CreateIndex
CREATE INDEX "ProductEvent_tenantId_sessionId_idx" ON "ProductEvent"("tenantId", "sessionId");
