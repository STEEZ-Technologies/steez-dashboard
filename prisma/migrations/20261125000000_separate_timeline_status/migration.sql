-- The import joined the last milestone's year and status into field 61.
-- Split at the end of a leading year. Keep ambiguous custom text in field 61.
WITH source AS (
  SELECT c.*, substring(c.text FROM '^[0-9]{4}') AS year_prefix
  FROM "WebsiteCopy" c JOIN "Tenant" t ON c."tenantId" = t.id
  WHERE t.slug = 'kawada' AND c.page = 'about-us' AND c.position = 61
), added AS (
  INSERT INTO "WebsiteCopy" ("tenantId", page, language, position, text)
  SELECT "tenantId", page, language, 75,
         CASE WHEN year_prefix IS NULL THEN '' ELSE trim(substr(text, 5)) END
  FROM source
  ON CONFLICT DO NOTHING
  RETURNING "tenantId", language
)
UPDATE "WebsiteCopy" c SET text = s.year_prefix FROM source s JOIN added a
ON a."tenantId" = s."tenantId" AND a.language = s.language
WHERE c."tenantId" = s."tenantId" AND c.page = s.page AND c.language = s.language
AND c.position = 61 AND s.year_prefix IS NOT NULL;
