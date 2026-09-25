-- CreateEnum
CREATE TYPE "ArticleCategory" AS ENUM ('EDUCATION', 'INDUSTRY', 'COMPANY');

-- CreateEnum
CREATE TYPE "GuideReader" AS ENUM ('DISTRIBUTOR', 'CUSTOMER', 'BOTH');

-- CreateEnum
CREATE TYPE "GuideBlockKind" AS ENUM ('P', 'H', 'LIST', 'TABLE');

-- CreateTable
CREATE TABLE "Article" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT,
    "standfirstEn" TEXT,
    "standfirstZh" TEXT,
    "bodyEn" TEXT,
    "bodyZh" TEXT,
    "metaTitleEn" TEXT,
    "metaTitleZh" TEXT,
    "metaDescriptionEn" TEXT,
    "metaDescriptionZh" TEXT,
    "primaryKeyword" TEXT,
    "secondaryKeywords" TEXT,
    "category" "ArticleCategory" NOT NULL DEFAULT 'EDUCATION',
    "imagePath" TEXT,
    "imageAltEn" TEXT,
    "imageAltZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "featured" BOOLEAN NOT NULL DEFAULT false,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Article_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Guide" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "reader" "GuideReader" NOT NULL DEFAULT 'BOTH',
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT,
    "standfirstEn" TEXT,
    "standfirstZh" TEXT,
    "minutes" INTEGER NOT NULL DEFAULT 5,
    "imagePath" TEXT,
    "imageAltEn" TEXT,
    "imageAltZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Guide_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "GuideBlock" (
    "id" TEXT NOT NULL,
    "guideId" TEXT NOT NULL,
    "kind" "GuideBlockKind" NOT NULL,
    "textEn" TEXT,
    "textZh" TEXT,
    "itemsEn" JSONB,
    "itemsZh" JSONB,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GuideBlock_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Article_tenantId_idx" ON "Article"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Article_tenantId_slug_key" ON "Article"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "Guide_tenantId_idx" ON "Guide"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Guide_tenantId_slug_key" ON "Guide"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "GuideBlock_guideId_idx" ON "GuideBlock"("guideId");

-- AddForeignKey
ALTER TABLE "Article" ADD CONSTRAINT "Article_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Guide" ADD CONSTRAINT "Guide_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GuideBlock" ADD CONSTRAINT "GuideBlock_guideId_fkey" FOREIGN KEY ("guideId") REFERENCES "Guide"("id") ON DELETE CASCADE ON UPDATE CASCADE;
