ALTER TABLE "Lead"
  ADD COLUMN "buyerCountry" TEXT,
  ADD COLUMN "productInterest" TEXT,
  ADD COLUMN "orderVolume" TEXT,
  ADD COLUMN "formLanguage" TEXT;

CREATE INDEX "Lead_tenantId_sessionId_createdAt_idx" ON "Lead"("tenantId", "sessionId", "createdAt");

CREATE TABLE "EnquiryStart" (
  "tenantId" TEXT NOT NULL REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  "sessionId" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "EnquiryStart_pkey" PRIMARY KEY ("tenantId", "sessionId")
);

CREATE INDEX "EnquiryStart_createdAt_idx" ON "EnquiryStart"("createdAt");
