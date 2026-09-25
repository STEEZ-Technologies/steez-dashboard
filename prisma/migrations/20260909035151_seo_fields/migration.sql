-- AlterTable
ALTER TABLE "Category" ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ogImagePath" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "canonicalUrl" TEXT,
ADD COLUMN     "imageAlt" TEXT,
ADD COLUMN     "noindex" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "ogImagePath" TEXT,
ADD COLUMN     "seoDescription" TEXT,
ADD COLUMN     "seoKeywords" TEXT,
ADD COLUMN     "seoTitle" TEXT;

-- AlterTable
ALTER TABLE "ProductImage" ADD COLUMN     "alt" TEXT;

-- AlterTable
ALTER TABLE "Tenant" ADD COLUMN     "baiduSiteToken" TEXT,
ADD COLUMN     "icpNumber" TEXT,
ADD COLUMN     "seoDefaultDescription" TEXT,
ADD COLUMN     "seoDefaultOgImagePath" TEXT,
ADD COLUMN     "seoOrganizationLogoPath" TEXT,
ADD COLUMN     "seoOrganizationName" TEXT,
ADD COLUMN     "seoSiteName" TEXT,
ADD COLUMN     "seoTitleTemplate" TEXT,
ADD COLUMN     "siteUrl" TEXT;
