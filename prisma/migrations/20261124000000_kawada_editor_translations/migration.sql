UPDATE "WebsiteCopy" c SET text = v.translation FROM "Tenant" t, (VALUES
('home', 31, '棉质系列 — Cotton', '棉质系列 — 棉质'),
('home', 32, '高效系列 — Dry-weave mesh', '高效系列 — 干爽网面'),
('home', 34, '棉质系列 — Soft, matte, breathable', '棉质系列 — 柔软、哑光、透气'),
('home', 35, '高效系列 — Silky, fast-drying', '高效系列 — 顺滑、速干'),
('home', 37, '棉质系列 — Sensitive skin, everyday wear', '棉质系列 — 敏感肌肤、日常穿戴'),
('home', 38, '高效系列 — Heavy flow, overnight, active days', '高效系列 — 量大、夜用及活动量大的日子'),
('contact-us', 62, 'ISO 9001, ISO 14001, ISO 13485, ISO 45001, ISO 50001. FDA registered. Third-party audits: FSC, SMETA, TÜV. We send copies of any certificate on request.', 'ISO 9001、ISO 14001、ISO 13485、ISO 45001、ISO 50001。已完成 FDA 注册。第三方审核包括 FSC、SMETA 和 TÜV。如有需要，我们可提供相关证书副本。')
) AS v(page, position, original, translation)
WHERE c."tenantId" = t.id AND t.slug = 'kawada' AND c.language = 'zh' AND c.page = v.page AND c.position = v.position AND c.text = v.original;

UPDATE "WebsiteMedia" m SET label = v.translation FROM "Tenant" t, (VALUES
('brief meeting', '需求沟通会议'),
('specification desk', '规格确认工作台'),
('nonwoven unwind rolls wide', '无纺布放卷工位全景'),
('qc cleanroom duo wide', '洁净室内的两名质检人员'),
('production line full wide', '生产线全景'),
('lab material test wide', '实验室材料检测全景'),
('dispatch warehouse', '发货仓库'),
('A presenter addressing employees seated in rows during a training session', '培训现场，讲师正在向就座的员工授课'),
('line engineers review', '产线工程师现场审查'),
('step 01 1080', '第 1 步'),
('OEM / ODM film', 'OEM / ODM 服务视频'),
('Step 2', '第 2 步'),
('Step 4', '第 4 步'),
('Step 5', '第 5 步'),
('production rolls wide', '生产用料卷全景'),
('production hall wide', '生产车间全景'),
('factory guarded aisle crop', '车间防护通道'),
('factory unwind stand crop', '工厂放卷架'),
('Innovation film', '技术创新视频'),
('Product catalogue PDF', '产品目录 PDF')
) AS v(original, translation)
WHERE m."tenantId" = t.id AND t.slug = 'kawada' AND m.language = 'zh' AND m.version = 0 AND m.label = v.original;
