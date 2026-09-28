-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('MACHINE', 'ACCESSORY');

-- CreateEnum
CREATE TYPE "ProductUseCase" AS ENUM ('KITCHEN', 'HOSPITALITY', 'LAB', 'MOBILE');

-- CreateEnum
CREATE TYPE "ProductWaterSource" AS ENUM ('MAINS', 'OPEN');

-- CreateEnum
CREATE TYPE "ProductDispensing" AS ENUM ('TANK', 'JAR', 'DIRECT');

-- CreateEnum
CREATE TYPE "ArticleTopic" AS ENUM ('REVERSE_OSMOSIS', 'CHOOSING', 'MAINTENANCE', 'WATER_QUALITY', 'SUSTAINABILITY', 'COMPANY');

-- CreateEnum
CREATE TYPE "ManualFactKey" AS ENUM ('FEED_TDS', 'FEED_MEMBRANE', 'SERVICE_COMBO_FILTER', 'SERVICE_MEMBRANE');

-- AlterTable
ALTER TABLE "Article" DROP COLUMN "bodyEn",
DROP COLUMN "bodyZh",
DROP COLUMN "category",
DROP COLUMN "featured",
DROP COLUMN "metaDescriptionEn",
DROP COLUMN "metaDescriptionZh",
DROP COLUMN "primaryKeyword",
DROP COLUMN "secondaryKeywords",
ADD COLUMN     "keywordsEn" TEXT[],
ADD COLUMN     "keywordsZh" TEXT[],
ADD COLUMN     "topic" "ArticleTopic" NOT NULL DEFAULT 'COMPANY';

-- AlterTable
ALTER TABLE "Guide" ADD COLUMN     "imageCustomerAltEn" TEXT,
ADD COLUMN     "imageCustomerAltZh" TEXT,
ADD COLUMN     "imageCustomerPath" TEXT,
ADD COLUMN     "imageDistributorAltEn" TEXT,
ADD COLUMN     "imageDistributorAltZh" TEXT,
ADD COLUMN     "imageDistributorPath" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "descriptionZh" TEXT,
ADD COLUMN     "kind" "ProductKind" NOT NULL DEFAULT 'MACHINE',
ADD COLUMN     "nameZh" TEXT,
ADD COLUMN     "useCases" "ProductUseCase"[];

-- DropEnum
DROP TYPE "ArticleCategory";

-- CreateTable
CREATE TABLE "ProductContent" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "textEn" TEXT NOT NULL,
    "textZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductContent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductFit" (
    "id" TEXT NOT NULL,
    "productId" TEXT NOT NULL,
    "litresPerDay" INTEGER,
    "minBar" INTEGER,
    "sources" "ProductWaterSource"[],
    "dispensing" "ProductDispensing" NOT NULL DEFAULT 'TANK',
    "powered" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProductFit_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ArticleBlock" (
    "id" TEXT NOT NULL,
    "articleId" TEXT NOT NULL,
    "kind" "GuideBlockKind" NOT NULL,
    "textEn" TEXT,
    "textZh" TEXT,
    "itemsEn" JSONB,
    "itemsZh" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ArticleBlock_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ManualFact" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" "ManualFactKey" NOT NULL,
    "valueEn" TEXT NOT NULL,
    "valueZh" TEXT,
    "noteEn" TEXT,
    "noteZh" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ManualFact_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProductContent_productId_idx" ON "ProductContent"("productId");

-- CreateIndex
CREATE UNIQUE INDEX "ProductFit_productId_key" ON "ProductFit"("productId");

-- CreateIndex
CREATE INDEX "ArticleBlock_articleId_idx" ON "ArticleBlock"("articleId");

-- CreateIndex
CREATE INDEX "ManualFact_tenantId_idx" ON "ManualFact"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "ManualFact_tenantId_key_key" ON "ManualFact"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "ProductContent" ADD CONSTRAINT "ProductContent_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductFit" ADD CONSTRAINT "ProductFit_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ArticleBlock" ADD CONSTRAINT "ArticleBlock_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ManualFact" ADD CONSTRAINT "ManualFact_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

