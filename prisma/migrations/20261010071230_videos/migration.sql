-- CreateEnum
CREATE TYPE "VideoKind" AS ENUM ('PRESS', 'DISTRIBUTOR', 'TRAINING', 'PRODUCT');

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "youtubeId" TEXT NOT NULL,
    "short" BOOLEAN NOT NULL DEFAULT false,
    "kind" "VideoKind" NOT NULL DEFAULT 'PRODUCT',
    "titleEn" TEXT NOT NULL,
    "titleZh" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Video_tenantId_idx" ON "Video"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Video_tenantId_youtubeId_key" ON "Video"("tenantId", "youtubeId");

-- AddForeignKey
ALTER TABLE "Video" ADD CONSTRAINT "Video_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed KomiBright's nine videos, in the site's order, exactly as
-- komibright-v2 lib/videos.ts lists them, so the shelf the site already shows
-- is what the client finds here. Dated the day the client listed them
-- (2026-09-29) rather than now, so they don't count as unpublished changes.
INSERT INTO "Video" ("id", "tenantId", "youtubeId", "short", "kind", "titleEn", "titleZh", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", v.youtube_id, v.short, v.kind::"VideoKind", v.title_en, v.title_zh, v.sort_order,
       TIMESTAMP '2026-09-29 00:00:00', TIMESTAMP '2026-09-29 00:00:00'
FROM "Tenant" t
CROSS JOIN (VALUES
  ('g_Oggx4L4I0', false, 'PRESS',       'Our Netherlands distributor, interviewed on Dutch TV',       '荷兰经销商接受当地电视台采访',          0),
  ('xTDJlsMzfW0', false, 'PRESS',       'A second interview on Netherlands TV',                       '荷兰电视台的第二次采访',                1),
  ('EsDypXuk9p0', true,  'DISTRIBUTOR', 'From our Netherlands distributor',                           '来自荷兰经销商',                        2),
  ('9lzTtu1kEvc', true,  'DISTRIBUTOR', 'From our distributor in Peru',                               '来自秘鲁经销商',                        3),
  ('0VI5kKA3ZXs', false, 'TRAINING',    'Training professional plumbers on KomiBright systems',      '专业水管工的 KomiBright 系统培训',      4),
  ('7w84CV1XMfg', false, 'TRAINING',    'Installing the KB-C25R',                                     'KB-C25R 安装演示',                      5),
  ('OdHjZRxcVHU', false, 'PRODUCT',     'A pump-free direct-flow system with two outlets',            '无泵直饮双出水系统',                    6),
  ('mo38-xX3QTs', false, 'PRODUCT',     'The 200 GPD stainless-steel system and its replaceable tank','200 GPD 不锈钢系统及其可更换储水罐',    7),
  ('hgd1QfJCw0A', true,  'PRODUCT',     'The KB-C200R with the Freedom Pitcher',                      'KB-C200R 与 Freedom 水壶',              8)
) AS v(youtube_id, short, kind, title_en, title_zh, sort_order)
WHERE t."slug" = 'komibright'
ON CONFLICT ("tenantId", "youtubeId") DO NOTHING;
