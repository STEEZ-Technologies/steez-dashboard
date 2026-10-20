-- CreateTable
CREATE TABLE "HomeContent" (
    "id" TEXT NOT NULL,
    "tenantId" TEXT NOT NULL,
    "heroTitle" JSONB,
    "heroSub" JSONB,
    "stats" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HomeContent_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "HomeContent_tenantId_key" ON "HomeContent"("tenantId");

-- AddForeignKey
ALTER TABLE "HomeContent" ADD CONSTRAINT "HomeContent_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "Tenant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Seed: what KomiBright's homepage says today (components/sections/HeroFilm.tsx
-- and TrustBar.tsx), back-dated so it doesn't show as an unpublished change.
INSERT INTO "HomeContent" ("id", "tenantId", "heroTitle", "heroSub", "stats", "createdAt", "updatedAt")
SELECT gen_random_uuid()::text, t."id", '{"en":"The filter you never think about","zh":"装好就不用操心的净水器","fr":"Le filtre auquel vous ne penserez jamais","it":"Il filtro a cui non penserai mai","es":"El filtro en el que nunca pensó","ja":"その存在を、忘れてしまうフィルター"}'::jsonb, '{"en":"Under-sink reverse osmosis that runs on tap pressure alone, with one combo cartridge where others use three.","zh":"仅靠自来水压力运行的厨下反渗透纯水机——一支复合滤芯，替代常规的三支前置滤芯。","fr":"L’osmose inverse sous évier qui fonctionne sur la seule pression du réseau, avec une cartouche combinée là où d’autres en utilisent trois.","it":"Osmosi inversa sottolavello che funziona con la sola pressione di rete, con una cartuccia combinata dove altri ne usano tre.","es":"Ósmosis inversa bajo fregadero que funciona solo con la presión de la red, con un cartucho combinado donde otros usan tres.","ja":"水道の圧力だけで動くシンク下RO浄水。前処理カートリッジは、3本から複合1本へ。"}'::jsonb, '[{"figure":{"en":"0","zh":"0","fr":"0","it":"0","es":"0","ja":"0"},"unit":{"en":"W","zh":"瓦","fr":"W","it":"W","es":"W","ja":"W"},"label":{"en":"Power draw","zh":"耗电量","fr":"Consommation","it":"Consumo elettrico","es":"Consumo eléctrico","ja":"消費電力"},"body":{"en":"The under-sink and commercial range runs on the pressure already in the mains. The A95R is the deliberate exception.","zh":"厨下与商用机型仅靠自来水压力运行；A95R 是全系唯一配备自吸泵的机型。","fr":"La gamme sous évier et professionnelle fonctionne sur la seule pression du réseau. L’A95R est l’exception assumée.","it":"La gamma sottolavello e professionale funziona con la pressione già presente in rete. L’A95R è l’eccezione voluta.","es":"La gama bajo fregadero y la comercial funcionan con la presión que ya hay en la red. El A95R es la excepción deliberada.","ja":"シンク下および業務用シリーズは、水道の圧力だけで稼働します。ポンプを搭載するのはKB-A95Rのみで、意図的な例外です。"},"href":"/information/"},{"figure":{"en":"1","zh":"1","fr":"1","it":"1","es":"1","ja":"1"},"unit":{"en":"cartridge","zh":"支","fr":"cartouche","it":"cartuccia","es":"cartucho","ja":"本"},"label":{"en":"Pre-filter","zh":"前置滤芯","fr":"Préfiltration","it":"Prefiltrazione","es":"Prefiltro","ja":"前処理カートリッジ"},"body":{"en":"Sediment and carbon in one combo cartridge, where a conventional system uses three.","zh":"泥沙过滤与活性炭集于一支复合滤芯，普通 RO 净水器则需三支。","fr":"Sédiments et charbon dans une seule cartouche combinée, là où un système classique en utilise trois.","it":"Sedimenti e carbone in un’unica cartuccia combinata, dove un sistema tradizionale ne usa tre.","es":"Sedimentos y carbón en un solo cartucho combinado, donde un sistema convencional usa tres.","ja":"沈殿物フィルターと活性炭を1本の複合カートリッジに統合。一般的なシステムでは3本必要です。"},"href":"/information/"},{"figure":{"en":"800","zh":"800","fr":"800","it":"800","es":"800","ja":"800"},"unit":{"en":"ppm","zh":"ppm","fr":"ppm","it":"ppm","es":"ppm","ja":"ppm"},"label":{"en":"Feed water","zh":"进水 TDS 上限","fr":"Eau d’alimentation","it":"Acqua in ingresso","es":"Agua de entrada","ja":"原水TDS上限"},"body":{"en":"Maximum dissolved solids the membrane will take from a municipal supply.","zh":"适用于市政自来水：进水中溶解性总固体不得高于此值。","fr":"Teneur maximale en solides dissous (TDS) admise par la membrane, sur eau du réseau.","it":"Il contenuto massimo di solidi disciolti che la membrana accetta dall’acqua di rete.","es":"Máximo de sólidos disueltos que la membrana admite con agua de la red.","ja":"水道水を原水とする場合に、膜が受け入れられる溶解性総固形分（TDS）の上限です。"},"href":"/information/"},{"figure":{"en":"~30","zh":"近 30","fr":"~30","it":"~30","es":"~30","ja":"~30"},"unit":{"en":"countries","zh":"个国家和地区","fr":"pays","it":"paesi","es":"países","ja":"か国"},"label":{"en":"In service","zh":"产品足迹","fr":"En service","it":"In servizio","es":"En servicio","ja":"稼働実績"},"body":{"en":"Systems installed with users in nearly thirty countries worldwide.","zh":"产品已销往近 30 个国家和地区。","fr":"Des systèmes installés chez des utilisateurs dans près de trente pays à travers le monde.","it":"Sistemi installati presso utenti di quasi trenta paesi nel mondo.","es":"Sistemas instalados con usuarios de casi treinta países de todo el mundo.","ja":"世界30か国近くのユーザーのもとで稼働しています。"},"href":"/about-us/"}]'::jsonb,
  TIMESTAMP '2026-10-01 00:00:00', TIMESTAMP '2026-10-01 00:00:00'
FROM "Tenant" t
WHERE t."slug" = 'komibright';
