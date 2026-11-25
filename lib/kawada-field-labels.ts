import { websiteCopyOrder } from "./kawada-editor";
import { kawadaSections } from "./kawada-sections";

type Label = readonly [en: string, zh: string];
const heading = ["Heading", "标题"] as const;
const main = ["Main heading", "主标题"] as const;
const eyebrow = ["Heading label", "标题上方小字"] as const;
const intro = ["Introduction", "简介"] as const;
const body = ["Description", "说明"] as const;
const button = ["Button wording", "按钮文字"] as const;
const link = ["Link wording", "链接文字"] as const;
const number = ["Number", "编号"] as const;
const label = ["Label", "标签"] as const;
const title = ["Title", "标题"] as const;
const question = ["Question", "问题"] as const;
const answer = ["Answer", "答案"] as const;
const year = ["Year", "年份"] as const;
const caption = ["Caption", "图注"] as const;
const instruction = ["Instructions", "操作提示"] as const;
const video = ["Video button wording", "视频按钮文字"] as const;

const fields: Record<string, Record<number, Label>> = {};
function assign(page: string, start: number, ...labels: Label[]) {
  const pageFields = fields[page] ??= {};
  labels.forEach((field, offset) => { pageFields[start + offset] = field; });
}

function group(page: string, start: number, prefix: Label, ...labels: Label[]) {
  assign(page, start, ...labels.map(([en, zh]): Label => [`${prefix[0]} · ${en}`, `${prefix[1]} · ${zh}`]));
}

assign("home", 0, eyebrow, ["Earlier banner heading (section editor)", "旧版横幅标题（栏目编辑器）"], intro, button);
assign("home", 90, main);
assign("home", 4, heading, intro, ["Carousel heading", "轮播标题"], ["Size range summary", "规格范围摘要"]);
assign("home", 9, ["Carousel accessibility label", "轮播无障碍标签"], ["Carousel card title", "轮播卡片标题"]);
assign("home", 12, heading, ["Topsheet label", "面层名称"], ["ADL label", "导流层名称"], ["Core label", "芯体名称"],
  ["Backsheet label", "底膜名称"], ["Release paper label", "离型纸名称"], caption);
assign("home", 19, heading, ["Layers statistic", "结构层数据"], ["Earlier length statistic", "旧版长度数据"], ["Patents statistic", "专利数据"],
  ["Production lines statistic", "生产线数据"], ["Company summary heading", "公司概况标题"], body, ["Our story link", "公司历程链接"]);
assign("home", 27, heading, ["First column heading", "第一列标题"], ["Second column heading", "第二列标题"]);
([["Material", "材质"], ["Feel", "触感"], ["Recommended use", "适用场景"]] as const).forEach((field, i) =>
  group("home", 30 + 3 * i, field, label, ["First column wording", "第一列文字"], ["Second column wording", "第二列文字"]));
assign("home", 39, heading, body, instruction, heading, ["Process overview heading", "流程概览标题"]);
for (let i = 1; i <= 7; i++) assign("home", 43 + i, [`Process step ${i} card wording`, `流程第 ${i} 步卡片文字`]);
assign("home", 51, ["Step preview label", "步骤预览标签"], ["Step preview heading", "步骤预览标题"], ["Step preview description", "步骤预览说明"],
  ["Explore step button", "查看步骤按钮"], ["Start a project button", "开启项目按钮"], ["OEM page link", "OEM 页面链接"]);
assign("home", 57, eyebrow, heading, intro, button);
for (let i = 1; i <= 3; i++) group("home", 58 + 3 * i, [`Innovation card ${i}`, `创新卡片 ${i}`], number, title, body);
assign("home", 70, ["Illustration note", "插图说明"], heading, ["Export heading", "出口标题"], ["Export regions", "出口地区"],
  ["Shipping summary heading", "运输概况标题"], ["Production heading", "生产标题"], ["Production description", "生产说明"],
  ["Ports heading", "港口标题"], ["Ports description", "港口说明"], heading);
assign("home", 81, eyebrow, heading, intro, ["Quote mark", "引号"], ["Testimonial quote", "客户评价原文"], ["Quote attribution", "评价署名"]);
assign("home", 88, heading, link);

assign("about-us", 0, eyebrow, main, intro, ["Plants label", "工厂数量标签"], ["Number of plants", "工厂数量"], ["Land area label", "占地面积标签"],
  ["Land area", "占地面积"], ["Founded label", "成立年份标签"], ["Founding year", "成立年份"]);
assign("about-us", 9, heading, ["Company description", "公司介绍"], ["Manufacturing services", "制造服务"]);
assign("about-us", 12, eyebrow, heading, intro);
for (let i = 1; i <= 3; i++) {
  assign("about-us", 14 + i, [`Map location ${i} wording`, `地图地点 ${i} 文字`]);
  assign("about-us", 18 + i, [`Production site ${i} card wording`, `生产基地 ${i} 卡片文字`]);
}
assign("about-us", 18, ["Sites list heading", "基地列表标题"]);
for (const start of [22, 35]) {
  assign("about-us", start, eyebrow, heading, intro, ["Additional details", "补充说明"]);
  for (let i = 1; i <= 3; i++) group("about-us", start + 1 + 3 * i,
    start === 22 ? [`Overview card ${i}`, `概览卡片 ${i}`] : [`Approval step ${i}`, `审批步骤 ${i}`], number, title, body);
}
assign("about-us", 48, eyebrow, heading, intro);
for (let i = 1; i <= 6; i++) group("about-us", 49 + 2 * i, [`Milestone ${i}`, `里程碑 ${i}`], year, body);
assign("about-us", 75, ["Milestone 6 · Status badge", "里程碑 6 · 状态标签"]);
assign("about-us", 63, eyebrow, heading, ["Training photo caption", "培训照片图注"]);
for (const [i, prefix] of ([[66, ["Quality management", "质量管理"]], [68, ["Workplace safety", "工作安全"]],
  [70, ["Employee training", "员工培训"]]] as const)) group("about-us", i, prefix, heading, body);
assign("about-us", 72, heading, body, button);

assign("products", 0, eyebrow, ["Collection label", "系列标签"], main, intro, ["Catalogue button wording", "目录按钮文字"]);
for (const start of [40, 44]) assign("products", start, eyebrow, heading, body, link);

assign("oem-odm", 0, video, main, intro, button, ["OEM tab wording", "OEM 标签文字"], ["ODM tab wording", "ODM 标签文字"],
  ["Selected service heading", "所选服务标题"], ["Selected service summary", "所选服务摘要"], ["Buyer responsibilities heading", "采购方职责标题"],
  ["Buyer responsibilities", "采购方职责"], ["Kawada responsibilities heading", "川田职责标题"], ["Kawada responsibilities", "川田职责"], button,
  ["Private label tab wording", "自有品牌标签文字"], ["Service image caption", "服务图片图注"],
  ["Consultation prompt", "咨询提示"], ["Consultation link", "咨询链接"], ["Consultation closing wording", "咨询提示结尾"], heading);
for (const [i, start] of [26, 31, 35, 39, 43, 47, 51].entries()) {
  const prefix = [`Manufacturing step ${i + 1}`, `制造步骤 ${i + 1}`] as const;
  group("oem-odm", 19 + i, prefix, ["Tab wording", "标签文字"]);
  group("oem-odm", start, prefix, ["Progress label", "进度标签"], title, ["Summary", "摘要"], body);
}
assign("oem-odm", 30, video);
assign("oem-odm", 55, ["Previous step button", "上一步按钮"], ["Next step button", "下一步按钮"]);
assign("oem-odm", 57, heading, intro, ["Lines caption", "生产线图注"], ["Tracking caption", "追踪系统图注"], ["Lab caption", "实验室图注"],
  ["Warehouse caption", "仓库图注"], ["Production lines label", "生产线标签"], ["Number of lines", "生产线数量"], ["Sites label", "基地标签"],
  ["Total floor area", "总占地面积"], ["Headcount label", "员工人数标签"], ["Headcount", "员工人数"], ["New plant heading", "新工厂标题"], ["New plant details", "新工厂详情"]);
assign("oem-odm", 71, heading, intro);
for (const [start, prefix] of ([[73, ["Sanitary pads", "卫生巾"]], [89, ["Pantyliners", "护垫"]],
  [105, ["Incontinence pads", "失禁垫"]], [121, ["Period pants", "经期裤"]]] as const)) {
  const pair = ([en, zh]: Label): Label[] => [[`${en} label`, `${zh}标签`], [en, zh]];
  group("oem-odm", start, prefix, ["Photo card wording", "图片卡片文字"], ["Back to photo button", "返回图片按钮"], title,
    ...pair(["Size", "尺寸"]), ...pair(["Wings", "护翼"]), ...pair(["Core", "芯体"]), ...pair(["Topsheet", "面层"]),
    ...pair(["MOQ per SKU", "每款起订量"]), ...pair(["Special functions", "特殊功能"]), ["Inquiry link", "询盘链接"]);
}
assign("oem-odm", 137, eyebrow, heading, intro, ["Response label", "响应标签"], ["Response time", "响应时间"],
  ["Report label", "报告标签"], ["Report time", "报告时间"], ["Complaints label", "投诉标签"], ["Response rate", "回复率"]);
assign("oem-odm", 146, heading);
for (let i = 1; i <= 9; i++) assign("oem-odm", 146 + i, [`Certification badge ${i}`, `认证徽章 ${i}`]);
assign("oem-odm", 156, link, heading, intro, instruction);
for (let i = 0; i < 20; i++) {
  group("oem-odm", 160 + i * 2, [`FAQ card ${i + 1}`, `常见问题卡片 ${i + 1}`], question, answer);
}
assign("oem-odm", 200, ["Pause button wording", "暂停按钮文字"]);

assign("innovation", 0, video, eyebrow, main, intro);
for (const start of [4, 12, 24]) assign("innovation", start, heading, ["Short summary", "简短摘要"], ["Construction details", "结构说明"],
  ["Development details", "开发说明"], ["Feature caption", "特点图注"], ["Technical details toggle", "技术细节开关"],
  ["Expanded construction details", "展开后的结构说明"], ["Expanded development details", "展开后的开发说明"]);
assign("innovation", 20, ["Patent number label", "专利编号标签"], ["Patent link", "专利链接"],
  ["Expanded patent number label", "展开后的专利编号标签"], ["Expanded patent link", "展开后的专利链接"]);
assign("innovation", 32, ["Project link", "项目链接"], ["Expanded project link", "展开后的项目链接"]);
assign("innovation", 34, eyebrow, heading, intro, ["Test list heading", "检测列表标题"]);
assign("innovation", 53, ["Alternate test list heading", "备用检测列表标题"]);
for (const start of [38, 54]) {
  for (let i = 0; i < 7; i++) group("innovation", start + 2 * i,
    start === 38 ? [`Test ${i + 1}`, `检测项目 ${i + 1}`] : [`Alternate test ${i + 1}`, `备用检测项目 ${i + 1}`],
    number, ["Name and description", "名称和说明"]);
  assign("innovation", start + 14, ["Test applicability note", "检测适用范围说明"]);
}
assign("innovation", 69, ["Lab photos button", "实验室照片按钮"], ["Certificates button", "证书按钮"], ["Close certificates button", "关闭证书按钮"],
  eyebrow, heading, intro);
for (const [start, prefix] of ([[75, ["Material selection", "材料选择"]], [79, ["Material efficiency", "材料效率"]]] as const)) {
  group("innovation", start, prefix, title, body, ["Toggle wording", "开关文字"], ["Expanded description", "展开后的说明"]);
}
assign("innovation", 83, eyebrow, heading, caption, link, ["Gallery position label", "图库位置标签"]);

assign("news", 6, eyebrow, ["Exhibition title", "展会名称"], ["Exhibition title (alternate placement)", "展会名称（备用位置）"],
  ["Exhibition dates", "展会日期"], ["Exhibition venue", "展会场地"], ["Booth wording", "展位文字"], ["Meeting button", "会面预约按钮"], ["Event website link", "展会网站链接"]);
assign("news", 16, eyebrow, heading, ["INDEX exhibition title", "INDEX 展会名称"], ["INDEX date and location", "INDEX 日期和地点"]);
assign("news", 22, ["CIDPEX exhibition title", "CIDPEX 展会名称"], ["CIDPEX date", "CIDPEX 日期"]);

assign("contact-us", 0, eyebrow, main, intro, ["Factory button wording", "工厂按钮文字"], ["Form heading", "表单标题"]);
assign("contact-us", 43, eyebrow, heading, intro, ["Address label", "地址标签"], ["Factory address", "工厂地址"], ["Directions link", "路线链接"]);
assign("contact-us", 51, heading, intro);
for (let i = 1; i <= 5; i++) group("contact-us", 51 + 2 * i, [`Buyer FAQ ${i}`, `采购常见问题 ${i}`], question, answer);

assign("catalogue", 0, eyebrow, main, intro);
assign("catalogue", 5, eyebrow, heading, intro);

for (const [page, start, end, contact, links] of [
  ["privacy", 17, 41, 43, 45], ["terms", 13, 29, 31, 33], ["cookies", 21, 33, 35, 37],
] as const) {
  assign(page, 0, main, ["Draft date", "草稿日期"], intro, ["Contents heading", "目录标题"]);
  const firstBody = page === "cookies" ? 11 : start;
  for (let position = 4; position < firstBody; position++) {
    assign(page, position, [`Contents link ${position - 3}`, `目录链接 ${position - 3}`]);
  }
  for (let position = start; position <= end; position += 2) {
    group(page, position, [`Topic ${(position - start) / 2 + 1}`, `主题 ${(position - start) / 2 + 1}`], heading, body);
  }
  group(page, contact, ["Contact information", "联系方式"], heading, body);
  assign(page, links, ["Privacy notice link", "隐私声明链接"], ["Terms of use link", "使用条款链接"], ["Cookies notice link", "Cookie 声明链接"]);
}
assign("cookies", 11, ["Storage table caption", "存储表标题"], ["Key column heading", "键名列标题"],
  ["Purpose column heading", "用途列标题"], ["Duration column heading", "时长列标题"]);
for (const [i, pos] of [15, 18].entries()) group("cookies", pos, [`Storage entry ${i + 1}`, `存储项 ${i + 1}`],
  ["Key and provider", "键名和提供方"], ["Purpose", "用途"], ["Duration", "时长"]);

export function websiteSection(page: string, position: number) {
  return kawadaSections[page]?.findLast(([start]) => start <= websiteCopyOrder(page, position));
}

export function websiteFieldLabel(page: string, position: number, zh: boolean) {
  const field = fields[page]?.[position];
  if (field) return field[zh ? 1 : 0];
  const section = websiteSection(page, position);
  return zh ? `${section?.[2] ?? "页面"}文字 · ${position}` : `${section?.[1] ?? "Page"} text · ${position}`;
}
