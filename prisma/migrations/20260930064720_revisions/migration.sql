-- CreateTable
CREATE TABLE "Revision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "entity" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "snapshot" JSONB NOT NULL,
    "userId" TEXT,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Revision_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Revision_tenantId_entity_entityId_createdAt_idx" ON "Revision"("tenantId", "entity", "entityId", "createdAt");

-- CreateIndex
CREATE INDEX "Revision_tenantId_action_createdAt_idx" ON "Revision"("tenantId", "action", "createdAt");

-- AddForeignKey
ALTER TABLE "Revision" ADD CONSTRAINT "Revision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
