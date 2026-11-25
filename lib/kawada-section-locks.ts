type Explanation = readonly [en: string, zh: string];

const productDisplay = [
  "The website’s product files supply the sizes and specifications shown here. Ask the website development team to update the display or its controls.",
  "这里显示的尺寸和规格来自网站的产品文件。请联系网站开发团队修改展示内容或控件。",
] as const;
const locks: Record<string, Record<number, Explanation>> = {
  home: {
    4: ["The website template supplies the carousel’s keyboard instructions and Close control. The website development team can change them.", "轮播的键盘操作提示和关闭控件由网站模板提供，请联系网站开发团队修改。"],
    79: ["The website template supplies the logo playback controls and testimonial counter. The website development team can change them.", "标志轮播控件和评价计数由网站模板提供，请联系网站开发团队修改。"],
  },
  "about-us": {
    48: ["You can edit the milestone years, descriptions and status badge. The website development team manages the timeline animation and layout.", "可编辑里程碑的年份、说明和状态标签。时间线动画和布局由网站开发团队管理。"],
  },
  products: {
    5: ["The website template defines the product selector’s options and switching behavior. The website development team can change them.", "产品选择器的选项和切换方式由网站模板定义，请联系网站开发团队修改。"],
    9: productDisplay,
    19: productDisplay,
    29: productDisplay,
  },
  "contact-us": {
    4: ["You can edit the form heading. The website development team manages the fields, required settings and submission messages in the template.", "可编辑表单标题。表单字段、必填设置和提交提示由网站开发团队通过模板管理。"],
    11: ["These choices are part of the inquiry form’s product options. The website development team can update them.", "这些选项属于询盘表单的产品选项，请联系网站开发团队修改。"],
    25: ["The template defines the order volume choices. The website development team can update them.", "订购数量选项由网站模板定义，请联系网站开发团队修改。"],
    32: ["The template defines the special function choices. The website development team can update them.", "特殊功能选项由网站模板定义，请联系网站开发团队修改。"],
    37: ["The website development team manages the message field, consent wording and submission controls in the template.", "留言字段、授权文字和提交控件由网站开发团队通过模板管理。"],
    43: ["The website development team manages the map embed and the Amap control. You can edit the address text below.", "地图嵌入和高德地图控件由网站开发团队管理。可在下方编辑地址文字。"],
  },
  news: {
    0: ["The website builds the filter choices and result counts from its news listings. The website development team manages the filter controls.", "筛选选项和结果数量由网站根据新闻列表生成。筛选控件由网站开发团队管理。"],
    14: ["The website template shows this message when a filter has no matches. The website development team manages the message and reset button.", "筛选无结果时由网站模板显示此提示。提示和重置按钮由网站开发团队管理。"],
    16: ["The website template generates the photo counts and gallery controls. The website development team can change their behavior.", "照片数量和图库控件由网站模板生成，请联系网站开发团队修改其操作方式。"],
    22: ["The website template generates the photo counts and gallery controls. The website development team can change their behavior.", "照片数量和图库控件由网站模板生成，请联系网站开发团队修改其操作方式。"],
  },
  catalogue: {
    3: ["Replace the workspace PDF under Section media. The website development team manages the download button, its wording and the back link.", "可在栏目媒体中替换工作区的 PDF。下载按钮、按钮文字和返回链接由网站开发团队管理。"],
    5: ["The website development team manages the reader’s page-turn controls, progress counter and full-size link. The reader’s introduction and media can be edited here.", "阅读器的翻页控件、页码和原图链接由网站开发团队管理。可在此编辑阅读器简介和媒体。"],
  },
};

export function websiteSectionLock(page: string, section: number, zh: boolean) {
  return locks[page]?.[section]?.[zh ? 1 : 0];
}
