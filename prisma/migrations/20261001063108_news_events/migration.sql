-- CreateEnum
CREATE TYPE "NewsEventKind" AS ENUM ('EXHIBITION', 'VISIT', 'PRESS', 'PRODUCT');

-- CreateEnum
CREATE TYPE "NewsEventDating" AS ENUM ('DAYS', 'YEAR', 'NONE');

-- CreateTable
CREATE TABLE "NewsEvent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "kind" "NewsEventKind" NOT NULL DEFAULT 'EXHIBITION',
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT,
    "placeEn" TEXT,
    "placeZh" TEXT,
    "booth" TEXT,
    "dating" "NewsEventDating" NOT NULL DEFAULT 'DAYS',
    "startDate" DATE,
    "endDate" DATE,
    "year" INTEGER,
    "imagePath" TEXT,
    "imageAltEn" TEXT,
    "imageAltZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NewsEvent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "NewsEvent_tenantId_idx" ON "NewsEvent"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "NewsEvent_tenantId_slug_key" ON "NewsEvent"("tenantId", "slug");

-- AddForeignKey
ALTER TABLE "NewsEvent" ADD CONSTRAINT "NewsEvent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
