-- CreateEnum
CREATE TYPE "DocumentSection" AS ENUM ('CERTIFICATES', 'COMPANY');

-- CreateTable
CREATE TABLE "DocumentGroup" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "section" "DocumentSection" NOT NULL DEFAULT 'CERTIFICATES',
    "title" JSONB NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "label" JSONB NOT NULL,
    "filePath" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DocumentGroup_tenantId_idx" ON "DocumentGroup"("tenantId");

-- CreateIndex
CREATE INDEX "Document_groupId_idx" ON "Document"("groupId");

-- CreateIndex
CREATE INDEX "Document_tenantId_idx" ON "Document"("tenantId");

-- AddForeignKey
ALTER TABLE "DocumentGroup" ADD CONSTRAINT "DocumentGroup_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "DocumentGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed KomiBright's certificate library exactly as komibright-v2
-- lib/certificates.ts lists it. The files are already on the site under
-- /documents/, so each row points there rather than at an upload; a file the
-- client uploads later gets an OSS key instead. Back-dated so nothing counts
-- as an unpublished change. Group ids are fixed so documents can reference
-- them; they only need to be unique.
INSERT INTO "DocumentGroup" ("id", "tenantId", "section", "title", "sortOrder", "createdAt", "updatedAt")
SELECT g.id || '-' || t."id", t."id", g.section::"DocumentSection", g.title, g.sort_order,
       TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00'
FROM "Tenant" t
CROSS JOIN (VALUES
  ('seed-docgroup-0', 'CERTIFICATES', '{"en":"Housing: PP5 material","zh":"机身外壳——PP5 材料","fr":"Corps de filtration : matériau PP5","it":"Corpo filtro: materiale PP5","es":"Carcasa: material PP5","ja":"ハウジング：PP5材料"}'::jsonb, 0),
  ('seed-docgroup-1', 'CERTIFICATES', '{"en":"3.2 gallon metal tank","zh":"3.2 加仑金属压力桶","fr":"Réservoir métallique de 3.2 gallons","it":"Serbatoio metallico da 3.2 galloni","es":"Depósito metálico de 3.2 galones","ja":"3.2ガロン金属製圧力タンク"}'::jsonb, 1),
  ('seed-docgroup-2', 'CERTIFICATES', '{"en":"RO membrane: Canature","zh":"RO 膜——开能（Canature）","fr":"Membrane d’osmose inverse : Canature","it":"Membrana RO: Canature","es":"Membrana de ósmosis inversa: Canature","ja":"RO膜：Canature"}'::jsonb, 2),
  ('seed-docgroup-3', 'CERTIFICATES', '{"en":"Priming pump: E-CHEN (A95R only)","zh":"自吸泵——E-CHEN（仅 A95R）","fr":"Pompe auto-amorçante : E-CHEN (A95R uniquement)","it":"Pompa autoadescante: E-CHEN (solo A95R)","es":"Bomba autocebante: E-CHEN (solo A95R)","ja":"自吸ポンプ：E-CHEN（A95Rのみ）"}'::jsonb, 3),
  ('seed-docgroup-4', 'CERTIFICATES', '{"en":"Activated carbon in the combo filter","zh":"复合滤芯中的活性炭","fr":"Charbon actif de la cartouche combinée","it":"Carbone attivo della cartuccia combinata","es":"Carbón activado del filtro combinado","ja":"複合フィルターの活性炭"}'::jsonb, 4),
  ('seed-docgroup-5', 'CERTIFICATES', '{"en":"Connectors: ITiGER","zh":"快接接头——ITiGER","fr":"Raccords : ITiGER","it":"Raccordi: ITiGER","es":"Conectores: ITiGER","ja":"継手：ITiGER"}'::jsonb, 5),
  ('seed-docgroup-6', 'CERTIFICATES', '{"en":"PE tubing: CCK","zh":"PE 管——CCK","fr":"Tube en PE : CCK","it":"Tubo in PE: CCK","es":"Tubo de PE: CCK","ja":"PEチューブ：CCK"}'::jsonb, 6),
  ('seed-docgroup-7', 'CERTIFICATES', '{"en":"RO membrane: Hunan Ovay","zh":"RO 膜——湖南欧维","fr":"Membrane d’osmose inverse : Hunan Ovay","it":"Membrana RO: Hunan Ovay","es":"Membrana de ósmosis inversa: Hunan Ovay","ja":"RO膜：湖南欧維"}'::jsonb, 7),
  ('seed-docgroup-8', 'CERTIFICATES', '{"en":"Combo filter cartridge: Ningbo H O","zh":"复合滤芯——宁波 H O","fr":"Cartouche combinée : Ningbo H O","it":"Cartuccia combinata: Ningbo H O","es":"Cartucho del filtro combinado: Ningbo H O","ja":"複合カートリッジ：寧波H O"}'::jsonb, 8),
  ('seed-docgroup-9', 'CERTIFICATES', '{"en":"Assembly lubricant","zh":"装配用润滑脂","fr":"Lubrifiant de montage","it":"Lubrificante di montaggio","es":"Lubricante de montaje","ja":"組立用潤滑剤"}'::jsonb, 9),
  ('seed-docgroup-10', 'COMPANY', '{"en":"The company","zh":"企业资质","fr":"L’entreprise","it":"L’azienda","es":"La empresa","ja":"企業としての認証"}'::jsonb, 0),
  ('seed-docgroup-11', 'COMPANY', '{"en":"A finished KomiBright machine","zh":"KomiBright 整机","fr":"Un appareil KomiBright complet","it":"Un apparecchio KomiBright completo","es":"Un equipo KomiBright completo","ja":"KomiBrightの製品本体"}'::jsonb, 1),
  ('seed-docgroup-12', 'COMPANY', '{"en":"WaterMark, Australia (through the distributor)","zh":"澳大利亚 WaterMark——经由当地经销商","fr":"WaterMark, Australie (via le distributeur)","it":"WaterMark, Australia (tramite il distributore)","es":"WaterMark, Australia (a través del distribuidor)","ja":"WaterMark（オーストラリア）：販売代理店経由"}'::jsonb, 2),
  ('seed-docgroup-13', 'COMPANY', '{"en":"A finished machine, registered by a customer","zh":"客户以自有品牌注册的整机","fr":"Un appareil complet, enregistré par un client","it":"Un apparecchio completo, registrato da un cliente","es":"Un equipo completo, registrado por un cliente","ja":"顧客が登録した製品本体"}'::jsonb, 3)
) AS g(id, section, title, sort_order)
WHERE t."slug" = 'komibright'
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "Document" ("id", "groupId", "tenantId", "label", "filePath", "sortOrder", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, d.group_id || '-' || t."id", t."id", d.label, d.file_path, d.sort_order,
       TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00'
FROM "Tenant" t
CROSS JOIN (VALUES
  ('seed-docgroup-0', '{"en":"NSF certificate","zh":"NSF 证书"}'::jsonb, '/documents/nsf-pp-material.pdf', 0),
  ('seed-docgroup-0', '{"en":"NSF certificate","zh":"NSF 证书"}'::jsonb, '/documents/nsf-pp-food-equipment-materials.pdf', 1),
  ('seed-docgroup-1', '{"en":"NSF certificate","zh":"NSF 证书"}'::jsonb, '/documents/nsf-metal-tank-3-2g.pdf', 0),
  ('seed-docgroup-1', '{"en":"CE certificate","zh":"CE 证书"}'::jsonb, '/documents/ce-metal-tank-3-2g.pdf', 1),
  ('seed-docgroup-1', '{"en":"RoHS certificate","zh":"RoHS 证书"}'::jsonb, '/documents/rohs-metal-tank-3-2g.pdf', 2),
  ('seed-docgroup-2', '{"en":"NSF certificate","zh":"NSF 证书"}'::jsonb, '/documents/nsf-ro-membrane-canature.pdf', 0),
  ('seed-docgroup-2', '{"en":"PFAS-free SGS certificate","zh":"SGS 无 PFAS 检测证书"}'::jsonb, '/documents/sgs-pfas-free-ro-membrane-canature.pdf', 1),
  ('seed-docgroup-3', '{"en":"CE – SGS certificate, 24 V","zh":"CE 证书（SGS），24 V"}'::jsonb, '/documents/ce-emc-sgs-priming-pump-24v.pdf', 0),
  ('seed-docgroup-3', '{"en":"CE – SGS certificate, 36 V","zh":"CE 证书（SGS），36 V"}'::jsonb, '/documents/ce-emc-sgs-priming-pump-36v.pdf', 1),
  ('seed-docgroup-4', '{"en":"NSF certificate (Jacobi carbon)","zh":"NSF 证书（Jacobi 活性炭）"}'::jsonb, '/documents/nsf-carbon-jacobi.pdf', 0),
  ('seed-docgroup-4', '{"en":"Iodine report (Haycarb)","zh":"碘值检测报告（Haycarb）"}'::jsonb, '/documents/iodine-report-carbon-haycarb.pdf', 1),
  ('seed-docgroup-4', '{"en":"MSDS certificate","zh":"MSDS 安全技术说明书"}'::jsonb, '/documents/msds-carbon.pdf', 2),
  ('seed-docgroup-4', '{"en":"SGS certificate, nano-silver carbon (Haycarb), Netherlands","zh":"SGS 检测报告：纳米银活性炭（Haycarb），荷兰"}'::jsonb, '/documents/sgs-nanosilver-carbon-haycarb-netherlands.pdf', 3),
  ('seed-docgroup-4', '{"en":"SGS certificate, nano-silver carbon (Haycarb), China","zh":"SGS 检测报告：纳米银活性炭（Haycarb），中国"}'::jsonb, '/documents/sgs-nanosilver-carbon-haycarb-china.pdf', 4),
  ('seed-docgroup-5', '{"en":"NSF certificate","zh":"NSF 证书"}'::jsonb, '/documents/nsf-connectors-itiger.pdf', 0),
  ('seed-docgroup-5', '{"en":"RoHS certificate","zh":"RoHS 证书"}'::jsonb, '/documents/rohs-connectors-itiger.pdf', 1),
  ('seed-docgroup-6', '{"en":"NSF/ANSI 58 listing","zh":"NSF/ANSI 58 认证名录"}'::jsonb, '/documents/nsf-58-listing-pe-tubing-cck.pdf', 0),
  ('seed-docgroup-6', '{"en":"NSF certificate (Kouw Pinnq / C.C.K.)","zh":"NSF 证书（Kouw Pinnq / C.C.K.）"}'::jsonb, '/documents/nsf-pe-tubing-cck.pdf', 1),
  ('seed-docgroup-6', '{"en":"RoHS certificate","zh":"RoHS 证书"}'::jsonb, '/documents/rohs-pe-tubing-cck.pdf', 2),
  ('seed-docgroup-7', '{"en":"NSF certificate, NSF/ANSI 58 and 61 (2017)","zh":"NSF 证书，NSF/ANSI 58 与 61（2017）"}'::jsonb, '/documents/nsf-ro-membrane-hunan-ovay.jpg', 0),
  ('seed-docgroup-8', '{"en":"NSF certificate, NSF/ANSI 42 (2016)","zh":"NSF 证书，NSF/ANSI 42（2016）"}'::jsonb, '/documents/nsf-combo-filter-ningbo-ho.jpg', 0),
  ('seed-docgroup-9', '{"en":"NSF letter, for use in and around food processing areas","zh":"NSF 函件：可用于食品加工区域及周边"}'::jsonb, '/documents/nsf-letter-lubricant-dc-1000.pdf', 0),
  ('seed-docgroup-9', '{"en":"MSDS by DOW","zh":"MSDS 安全技术说明书（陶氏 DOW）"}'::jsonb, '/documents/msds-lubricant-dow-dc-1000.pdf', 1),
  ('seed-docgroup-10', '{"en":"ISO quality management system: Shanghai Conjoin Water Purification Technology","zh":"ISO 质量管理体系认证——上海博锐特水科技有限公司（Shanghai Conjoin Water Purification Technology）"}'::jsonb, '/documents/iso-quality-management-shanghai-conjoin.pdf', 0),
  ('seed-docgroup-10', '{"en":"KomiBright''s own certificate summary, component by component","zh":"我们的认证汇总表（按零部件逐项列出）"}'::jsonb, '/documents/komibright-certificate-summary.pdf', 1),
  ('seed-docgroup-11', '{"en":"CE / EMC, SGS Verification of Compliance SHEM260400258301HSC: KB-A95R, issued to Shanghai Conjoin Water Purification Technology","zh":"CE / EMC 符合性验证（SGS，编号 SHEM260400258301HSC）——KB-A95R，持证方为上海博锐特水科技有限公司（Shanghai Conjoin Water Purification Technology）"}'::jsonb, '/documents/ce-emc-sgs-kb-a95r.jpg', 0),
  ('seed-docgroup-12', '{"en":"Aquapod RO 350 label: WaterMark WMTS-103 / WM-022749, Aqualife Products","zh":"Aquapod RO 350 产品标签——WaterMark WMTS-103 / WM-022749，Aqualife Products"}'::jsonb, '/documents/watermark-aquapod-ro-350.jpg', 0),
  ('seed-docgroup-12', '{"en":"Aquapod RO 3000 label: WaterMark WMTS-103 / WM-022749, Aqualife Products","zh":"Aquapod RO 3000 产品标签——WaterMark WMTS-103 / WM-022749，Aqualife Products"}'::jsonb, '/documents/watermark-aquapod-ro-3000.jpg', 1),
  ('seed-docgroup-13', '{"en":"FDA Philippines, Certificate of Health Related Device Registration: issued to Wellthy Solutions Inc. for the Wellthy WS 390","zh":"菲律宾 FDA 健康相关器械注册证书——持证方为 Wellthy Solutions Inc.，对应其自有品牌机型 Wellthy WS 390"}'::jsonb, '/documents/fda-philippines-wellthy-ws390.pdf', 0)
) AS d(group_id, label, file_path, sort_order)
WHERE t."slug" = 'komibright'
  AND NOT EXISTS (SELECT 1 FROM "Document" x WHERE x."tenantId" = t."id");
