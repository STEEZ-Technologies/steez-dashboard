ALTER TABLE "WebsiteCopy" ADD COLUMN "version" INTEGER NOT NULL DEFAULT 0;

CREATE TABLE "WebsiteCopyRevision" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "page" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "position" INTEGER NOT NULL,
    "version" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "before" TEXT,
    "after" TEXT,
    "userId" TEXT,
    "userEmail" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "WebsiteCopyRevision_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "WebsiteCopyRevision_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "WebsiteCopyRevision_field_version_key"
ON "WebsiteCopyRevision"("tenantId", "page", "language", "position", "version");
CREATE INDEX "WebsiteCopyRevision_page_date_idx"
ON "WebsiteCopyRevision"("tenantId", "page", "language", "createdAt");

-- The live banner now has a different headline. Keep the earlier field's identity.
INSERT INTO "WebsiteCopy" ("tenantId", "page", "language", "position", "text")
SELECT t.id, 'home', headline.language, 90, headline.text
FROM "Tenant" t CROSS JOIN (VALUES
    ('en', 'More care, More love'),
    ('zh', '更多关爱，更多爱'),
    ('es', 'Más cuidado, Más amor')
) AS headline(language, text)
WHERE t.slug = 'kawada'
ON CONFLICT DO NOTHING;
