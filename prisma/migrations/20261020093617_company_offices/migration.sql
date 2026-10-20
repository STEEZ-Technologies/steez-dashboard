-- CreateTable
CREATE TABLE "CompanyProfile" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "whatsapp" TEXT,
    "icpNumber" TEXT,
    "catalogueUrl" TEXT,
    "replyWithin" JSONB,
    "footerAddress" JSONB,
    "salesName" TEXT,
    "salesRole" JSONB,
    "salesBase" JSONB,
    "salesWhatsapp" TEXT,
    "salesEmail" TEXT,
    "salesWeb" TEXT,
    "socials" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyProfile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Office" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "name" JSONB NOT NULL,
    "company" JSONB,
    "address" JSONB NOT NULL,
    "tel" TEXT,
    "fax" TEXT,
    "email" TEXT,
    "web" TEXT,
    "line" TEXT,
    "lat" DOUBLE PRECISION,
    "lon" DOUBLE PRECISION,
    "showMap" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Office_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "CompanyProfile_tenantId_key" ON "CompanyProfile"("tenantId");

-- CreateIndex
CREATE INDEX "Office_tenantId_idx" ON "Office"("tenantId");

-- CreateIndex
CREATE UNIQUE INDEX "Office_tenantId_key_key" ON "Office"("tenantId", "key");

-- AddForeignKey
ALTER TABLE "CompanyProfile" ADD CONSTRAINT "CompanyProfile_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Office" ADD CONSTRAINT "Office_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed KomiBright's contact details exactly as komibright-v2 prints them
-- today (components/layout/Footer.tsx, app/(en)/contact/ContactContent.tsx,
-- lib/replyPromise.ts), so the client finds here what their site already
-- shows. Back-dated so it doesn't count as an unpublished change.
INSERT INTO "CompanyProfile" ("id", "tenantId", "email", "phone", "whatsapp", "catalogueUrl", "replyWithin", "footerAddress", "salesName", "salesRole", "salesBase", "salesWhatsapp", "salesEmail", "salesWeb", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", 'info@komibright.com', '400-068-0889', '+886 932 137 562', 'https://book291982.publuu.com/',
  '{"en": "two business days", "zh": "两个工作日", "fr": "deux jours ouvrés", "it": "due giorni lavorativi", "es": "dos días hábiles", "ja": "2営業日"}'::jsonb, '{"en": "F.202, Building B\nNo. 6 Huazhong Road\nMinhang District, Shanghai", "zh": "上海市闵行区\n华中路6号\nB栋202室", "ja": "上海市閔行区\n華中路6号\nB棟202室"}'::jsonb, 'Carlos Malo', '{"en": "International Sales Manager", "zh": "国际销售经理", "fr": "Responsable des ventes internationales", "it": "Responsabile vendite internazionali", "es": "Director de ventas internacionales", "ja": "海外営業マネージャー"}'::jsonb, '{"en": "Zaragoza, Spain", "zh": "西班牙萨拉戈萨", "fr": "Saragosse, Espagne", "it": "Saragozza, Spagna", "es": "Zaragoza, España", "ja": "スペイン・サラゴサ"}'::jsonb,
  '+34-610-717393', 'carlos@komibright.com.tw', 'www.komibright.com',
  TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00'
FROM "Tenant" t
WHERE t."slug" = 'komibright'
ON CONFLICT ("tenantId") DO NOTHING;

INSERT INTO "Office" ("id", "tenantId", "key", "name", "company", "address", "tel", "fax", "email", "web", "line", "lat", "lon", "showMap", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", o.key, o.name, o.company, o.address, o.tel, o.fax, o.email, o.web, o.line, o.lat, o.lon, o.show_map, o.sort_order,
       TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00'
FROM "Tenant" t
CROSS JOIN (VALUES
  ('shanghai', '{"en": "Shanghai Office", "zh": "上海办公室", "fr": "Bureau de Shanghai", "it": "Sede di Shanghai", "es": "Oficina de Shanghái", "ja": "上海オフィス"}'::jsonb, '{"en": "Shanghai Conjoin Water Purification Technology", "zh": "上海博锐特水科技有限公司", "fr": "Shanghai Conjoin Water Purification Technology", "it": "Shanghai Conjoin Water Purification Technology", "es": "Shanghai Conjoin Water Purification Technology", "ja": "Shanghai Conjoin Water Purification Technology"}'::jsonb, '{"en": "F. 202, Bldg. B (Der-Bi-E), No. 6, Hua Zhong Rd., Min Hang Dist., Shanghai", "zh": "中国上海市闵行区华宁路 6 号 B 栋 202 室", "fr": "F. 202, Bldg. B (Der-Bi-E), No. 6, Hua Zhong Rd., Min Hang Dist., Shanghai", "it": "F. 202, Bldg. B (Der-Bi-E), No. 6, Hua Zhong Rd., Min Hang Dist., Shanghai", "es": "F. 202, Bldg. B (Der-Bi-E), No. 6, Hua Zhong Rd., Min Hang Dist., Shanghai", "ja": "中国上海市閔行区華中路6号B棟202室"}'::jsonb, '400-068-0889', '+86-21-3497 5992', NULL, 'www.komibright.com', NULL, 31.11, 121.38, true, 0),
  ('taiwan', '{"en": "Taiwan Office", "zh": "台北办公室（中国台湾）", "fr": "Bureau de Taipei", "it": "Sede di Taipei", "es": "Oficina de Taipéi", "ja": "台北オフィス"}'::jsonb, '{"en": "KomiBright Water Purification Technology", "zh": "KomiBright Water Purification Technology", "fr": "KomiBright Water Purification Technology", "it": "KomiBright Water Purification Technology", "es": "KomiBright Water Purification Technology", "ja": "KomiBright Water Purification Technology"}'::jsonb, '{"en": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan", "zh": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan", "fr": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan", "it": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan", "es": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan", "ja": "12 F., No. 2, Guanqian Rd., Zhongzheng Dist., Taipei City 100007, Taiwan"}'::jsonb, '0800-555205', '+886-2-2908-5503', 'info@komibright.com.tw', NULL, '@208iqmpb', 25.045, 121.515, true, 1),
  ('quanzhou', '{"en": "Factory: Quanzhou", "zh": "泉州工厂", "fr": "Usine de Quanzhou", "it": "Stabilimento di Quanzhou", "es": "Fábrica de Quanzhou", "ja": "泉州工場"}'::jsonb, NULL, '{"en": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China", "zh": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China", "fr": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China", "it": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China", "es": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China", "ja": "Building 2, Rihui Industrial Park, No. 78, Xinzukou, Taoyuan Industrial Zone, Fongzhou Town, Nan''an, Quanzhou, Fujian Province, Mainland China"}'::jsonb, '+86-13505990006', NULL, NULL, NULL, NULL, 24.9569, 118.5318, false, 2)
) AS o(key, name, company, address, tel, fax, email, web, line, lat, lon, show_map, sort_order)
WHERE t."slug" = 'komibright'
ON CONFLICT ("tenantId", "key") DO NOTHING;
