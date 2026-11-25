// Positions are the permanent keys assigned by the website-copy migration.
// Removing an entry never renumbers the entries that follow it.
type Section = [start: number, name: string, chinese: string];
export const kawadaSections: Record<string, Section[]> = {
  home: [[0,"Opening banner","首页横幅"],[4,"Product range","产品系列"],[12,"Pad layers","产品结构"],[19,"Manufacturing figures","制造数据"],[27,"Topsheet comparison","面层对比"],[39,"Absorbent core","吸收芯体"],[42,"OEM process","代工流程"],[57,"Innovation highlights","创新亮点"],[71,"Export markets","出口市场"],[79,"Partners & testimonials","合作伙伴与评价"],[88,"News links","新闻链接"]],
  "about-us": [[0,"Company at a glance","公司概况"],[9,"Company profile","公司简介"],[12,"Production sites","生产基地"],[22,"Materials & construction","材料与结构"],[35,"Sample approval","样品确认"],[48,"Company history","公司历程"],[63,"Safety & quality","安全与质量"],[72,"Contact invitation","联系邀请"]],
  products: [[0,"Collection introduction","产品系列介绍"],[5,"Product selector","产品选择器"],[9,"Sanitary pad display","卫生巾展示"],[19,"Pantyliner display","护垫展示"],[29,"Incontinence pad display","失禁垫展示"],[40,"Manufacturing links","制造相关链接"]],
  "oem-odm": [[0,"Opening banner","页面横幅"],[4,"OEM & ODM services","OEM 与 ODM 服务"],[17,"Manufacturing process","制造流程"],[57,"Production facilities","生产设施"],[71,"Product options","产品选项"],[89,"Pantyliner options","护垫选项"],[105,"Incontinence options","失禁垫选项"],[121,"Period pants options","经期裤选项"],[137,"Service & quality","服务与质量"],[146,"Certifications","认证"],[157,"Frequently asked questions","常见问题"]],
  innovation: [[0,"Overview","概览"],[4,"Heat-bonded construction","热合结构"],[12,"Raised-core engineering","凸起芯体"],[24,"Period pants","经期裤"],[34,"Laboratory testing","实验室检测"],[72,"Materials & sustainability","材料与可持续性"],[84,"Factory gallery","工厂图库"]],
  news: [[0,"News filters","新闻筛选"],[6,"Upcoming exhibition","即将举办的展会"],[14,"Empty results","空结果提示"],[16,"Recent exhibitions","近期展会"],[22,"CIDPEX exhibition","CIDPEX 展会"]],
  "contact-us": [[0,"Contact introduction","联系介绍"],[4,"Inquiry form","询盘表单"],[11,"Product interests","产品意向"],[25,"Order volume","订购数量"],[32,"Special functions","特殊功能"],[37,"Message & consent","留言与授权"],[43,"Factory address & map","工厂地址与地图"],[51,"Buyer questions","采购常见问题"]],
  catalogue: [[0,"Catalogue introduction","目录介绍"],[3,"Navigation & download","导航与下载"],[5,"Catalogue reader","目录阅读器"]],
  privacy: [[0,"Notice introduction","声明介绍"],[3,"Contents","目录"],[17,"Data collection","数据收集"],[25,"Processing & retention","处理与保留"],[33,"Rights & safeguards","权利与保护"],[41,"Updates & contact","更新与联系"],[45,"Policy links","政策链接"]],
  terms: [[0,"Terms introduction","条款介绍"],[3,"Contents","目录"],[13,"Website use","网站使用"],[19,"Products & orders","产品与订单"],[23,"Downloads & disputes","下载与争议"],[29,"Changes & contact","变更与联系"],[33,"Policy links","政策链接"]],
  cookies: [[0,"Notice introduction","声明介绍"],[3,"Contents","目录"],[11,"Storage inventory","存储清单"],[21,"Browser storage","浏览器存储"],[29,"Tracking & controls","跟踪与控制"],[33,"Review & contact","审核与联系"],[37,"Policy links","政策链接"]],
};
