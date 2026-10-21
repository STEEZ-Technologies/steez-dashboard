/* THE DASHBOARD MANUAL, for the people at a client's company who keep their
 * website up to date. It drives two things: the /help page, which reads it
 * end to end, and the (i) button beside each page title (components/shell/
 * page-help.tsx), which opens the topic for the page you're on.
 *
 * Written for someone who is not technical: what each page is for, then the
 * steps. Keep it true to the app — when a page changes, change its topic. */

export type HelpLocale = "en" | "zh";
type T = Record<HelpLocale, string>;

export type HelpSection = {
  heading: T;
  /** Plain paragraphs. */
  body?: T[];
  /** Numbered steps. */
  steps?: T[];
  /** A highlighted tip or warning under the section. */
  note?: { kind: "tip" | "warning"; text: T };
};

export type HelpTopic = {
  id: string;
  title: T;
  /** One or two sentences: what this page is for. */
  summary: T;
  /** Dashboard routes this topic explains; the longest match wins. */
  paths: string[];
  sections: HelpSection[];
};

export type HelpChapter = { title: T; topics: HelpTopic[] };

export const MANUAL: HelpChapter[] = [
  {
    title: { en: "Getting started", zh: "入门" },
    topics: [
      {
        id: "basics",
        title: { en: "Finding your way around", zh: "认识后台" },
        summary: {
          en: "The dashboard is where your team keeps your website up to date: products, news, documents, contact details and more. Nothing you change here reaches the website until it is published.",
          zh: "后台是团队维护网站内容的地方：产品、资讯、文件、联系方式等。在这里所做的修改，发布之后才会出现在网站上。",
        },
        paths: [],
        sections: [
          {
            heading: { en: "The sidebar", zh: "侧边栏" },
            body: [
              {
                en: "Overview and Enquiries show how buyers use your site. Catalog holds everything the site shows — Products, News, Resources, Homepage and Company. Settings holds your account and your team.",
                zh: "“总览”和“询盘”显示买家如何使用网站。“产品目录”包含网站展示的全部内容——产品、资讯、资料、首页和公司信息。“设置”中是您的账户和团队。",
              },
              {
                en: "On a phone, open the sidebar with the button at the top left.",
                zh: "在手机上，点击左上角的按钮打开侧边栏。",
              },
            ],
          },
          {
            heading: { en: "Search and shortcuts", zh: "搜索与快捷方式" },
            body: [
              {
                en: "Press Ctrl K (⌘ K on a Mac), or tap Search at the top, to jump to any page or product by typing its name.",
                zh: "按 Ctrl K（Mac 上为 ⌘ K），或点击顶部的“搜索”，输入名称即可跳转到任意页面或产品。",
              },
            ],
          },
          {
            heading: { en: "Dashboard language and theme", zh: "后台语言与外观" },
            body: [
              {
                en: "The 文A button at the top switches the dashboard between English and Chinese. The sun/moon button switches light and dark. Neither changes your website.",
                zh: "顶部的 文A 按钮可在中英文之间切换后台界面；太阳/月亮按钮切换浅色与深色。两者都不会影响网站。",
              },
            ],
          },
          {
            heading: { en: "The (i) button", zh: "（i）按钮" },
            body: [
              {
                en: "Every page has an (i) next to its title. Tap it for help with that page, without leaving it.",
                zh: "每个页面标题旁都有一个（i）。点击即可查看该页面的说明，无需离开当前页面。",
              },
            ],
          },
        ],
      },
      {
        id: "publishing",
        title: { en: "Publishing your changes", zh: "发布修改" },
        summary: {
          en: "Saving keeps a change in the dashboard. Publishing puts every saved change on the live website at once.",
          zh: "“保存”只把修改留在后台；“发布”会把所有已保存的修改一次性更新到正式网站。",
        },
        paths: ["/preview"],
        sections: [
          {
            heading: { en: "Save, then publish", zh: "先保存，再发布" },
            steps: [
              {
                en: "Make your changes and press Save. A yellow bar at the top of the page counts the changes not yet live.",
                zh: "完成修改后点击“保存”。页面顶部的黄色提示条会显示尚未上线的修改数量。",
              },
              {
                en: "Press Preview changes in that bar to see what will go live.",
                zh: "点击提示条中的“预览更改”，查看即将上线的内容。",
              },
              {
                en: "Press Publish to live site. The website rebuilds in a minute or two.",
                zh: "点击“发布到官网”。网站将在一两分钟内完成更新。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "You can save many changes over several days and publish them together.",
                zh: "可以在几天内陆续保存多处修改，最后一起发布。",
              },
            },
          },
          {
            heading: { en: "Who can publish", zh: "谁可以发布" },
            body: [
              {
                en: "Only owners can publish. Staff can make and save changes; an owner then publishes them.",
                zh: "只有所有者可以发布。员工可以修改并保存，再由所有者发布。",
              },
              {
                en: "If the bar says publishing isn't connected yet, your changes are safely saved — STEEZ will connect your website.",
                zh: "如果提示“尚未连接发布”，说明修改已安全保存，STEEZ 会为您连接网站。",
              },
            ],
          },
        ],
      },
      {
        id: "languages",
        title: { en: "Writing in several languages", zh: "多语言编辑" },
        summary: {
          en: "Text is written once per language your website is published in. English is always required; any other language left blank shows the English.",
          zh: "网站发布的每种语言都需要单独填写文字。英文必填；其他语言留空时，网站会显示英文。",
        },
        paths: [],
        sections: [
          {
            heading: { en: "The Writing in bar", zh: "“编辑语言”栏" },
            steps: [
              {
                en: "Pick a language in the Writing in bar at the top of the form. Every field below switches to that language.",
                zh: "在表单顶部的“编辑语言”栏中选择一种语言，下方所有字段都会切换到该语言。",
              },
              {
                en: "Fill in the fields, then pick the next language. You only need to press Save once, at the end.",
                zh: "填写完毕后切换到下一种语言。全部完成后只需点击一次“保存”。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "An amber dot on a language means some fields in it are still empty. On a phone, swipe the bar sideways to see every language.",
                zh: "语言旁的橙色圆点表示该语言仍有字段未填写。在手机上，左右滑动该栏可看到全部语言。",
              },
            },
          },
          {
            heading: { en: "When you change the English", zh: "修改英文之后" },
            body: [
              {
                en: "Translations are not updated for you. After changing the English, check the same field in each other language.",
                zh: "其他语言不会自动更新。修改英文后，请逐一检查其他语言中的相同字段。",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: { en: "Your buyers", zh: "您的买家" },
    topics: [
      {
        id: "overview",
        title: { en: "Overview", zh: "总览" },
        summary: {
          en: "How buyers used your site in the last 30 days: visits, product views and clicks, enquiries and won deals.",
          zh: "过去 30 天买家使用网站的情况：访问量、产品浏览与点击、询盘和成交。",
        },
        paths: ["/"],
        sections: [
          {
            heading: { en: "Reading the figures", zh: "如何解读数据" },
            body: [
              {
                en: "Tap the small (i) beside any figure for what it counts. Click-through rate is product clicks divided by product views — how well product pages turn lookers into interested buyers.",
                zh: "点击任一数据旁的小（i）可查看其含义。点击率 = 产品点击 ÷ 产品浏览，反映产品页把浏览者转化为意向买家的能力。",
              },
              {
                en: "Won deals and their value appear once you mark enquiries as Won and enter what the order is worth.",
                zh: "在询盘中标记“成交”并填写订单金额后，这里会显示成交数量与金额。",
              },
            ],
          },
        ],
      },
      {
        id: "analytics",
        title: { en: "Analytics", zh: "数据分析" },
        summary: {
          en: "A closer look at your visitors: where they come from, which devices they use and which products they look at.",
          zh: "更详细的访客数据：来源、使用的设备以及浏览的产品。",
        },
        paths: ["/analytics", "/products/[id]/analytics"],
        sections: [
          {
            heading: { en: "Using the report", zh: "使用报告" },
            body: [
              {
                en: "Choose 7, 30 or 90 days at the top. Needs attention lists published products nobody viewed, and products viewed but never clicked — worth better photos, specs or promotion.",
                zh: "在顶部选择 7、30 或 90 天。“需要关注”列出了无人浏览的已发布产品，以及有人浏览但无人点击的产品——这些产品值得改进照片、参数或加强推广。",
              },
              {
                en: "Each product also has its own report: open the product and press View analytics.",
                zh: "每个产品也有单独的报告：打开产品后点击“View analytics”。",
              },
            ],
          },
        ],
      },
      {
        id: "enquiries",
        title: { en: "Enquiries", zh: "询盘" },
        summary: {
          en: "Every contact form sent from your website, with the product the buyer was looking at and what they browsed before writing.",
          zh: "网站上提交的每一份联系表单，包括买家当时浏览的产品以及留言前的浏览记录。",
        },
        paths: ["/leads"],
        sections: [
          {
            heading: { en: "Following up", zh: "跟进询盘" },
            steps: [
              {
                en: "Open an enquiry to read the message and see Before enquiring — the pages the buyer visited first.",
                zh: "打开询盘，阅读留言并查看“询盘前的浏览”——买家此前访问过的页面。",
              },
              {
                en: "Move it along as you work: New, Contacted, Quoted, then Won or Lost.",
                zh: "随着跟进推进状态：新询盘、已联系、已报价，最后为已成交或未成交。",
              },
              {
                en: "When an order is won, enter the deal value. It adds to the totals on Overview.",
                zh: "成交后填写订单金额，该金额会计入“总览”的统计。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "Internal notes are only seen by your team. Each new enquiry is also emailed to the addresses set in Settings.",
                zh: "内部备注只有团队成员可见。每条新询盘也会发送到“设置”中填写的邮箱。",
              },
            },
          },
          {
            heading: { en: "Archiving and deleting", zh: "归档与删除" },
            body: [
              {
                en: "Archive an enquiry to clear it from the list but keep it. Only owners can delete an enquiry, and deleting cannot be undone.",
                zh: "归档可将询盘移出列表但仍保留记录。只有所有者可以删除询盘，删除后无法恢复。",
              },
            ],
          },
        ],
      },
    ],
  },
  {
    title: { en: "Your website's content", zh: "网站内容" },
    topics: [
      {
        id: "products",
        title: { en: "Products", zh: "产品" },
        summary: {
          en: "Your catalogue: every product with its name, description, photos, specs and category. The order here is the order on your site.",
          zh: "您的产品目录：每个产品的名称、介绍、照片、参数和分类。此处的排列顺序即网站上的顺序。",
        },
        paths: ["/products"],
        sections: [
          {
            heading: { en: "Adding a product", zh: "添加产品" },
            steps: [
              {
                en: "On Products, press New product.",
                zh: "在“产品”页点击“新建产品”。",
              },
              {
                en: "Fill in the model, name and description in each language, choose a category and upload a photo.",
                zh: "填写型号，以及每种语言的名称和介绍，选择分类并上传照片。",
              },
              {
                en: "Leave Published on to show it on the site, then press Save and publish.",
                zh: "保持“已发布”开启即可在网站上显示，然后保存并发布。",
              },
            ],
            note: {
              kind: "warning",
              text: {
                en: "Use a real photo of the product. A new product without a photo is not shown on the website.",
                zh: "请使用产品的真实照片。没有照片的新产品不会显示在网站上。",
              },
            },
          },
          {
            heading: { en: "Editing a product", zh: "编辑产品" },
            body: [
              {
                en: "Click a product to edit it. The tabs split it up: Basics (names and text), Photos & 3D, Specs & box, and Finder quiz (how the site's product finder matches it).",
                zh: "点击产品即可编辑。各标签页分别为：Basics（名称与文字）、Photos & 3D（照片与 3D）、Specs & box（参数与包装）、Finder quiz（网站选型工具如何匹配该产品）。",
              },
              {
                en: "The bar at the top lists anything still missing, like a Chinese description or specs, so buyers see the full product.",
                zh: "顶部的提示条会列出仍缺少的内容，例如中文介绍或参数，补全后买家可看到完整信息。",
              },
              {
                en: "Preview on site opens the product as it is on your live website now.",
                zh: "“在网站预览”（Preview on site）会打开该产品在正式网站上的当前页面。",
              },
            ],
          },
          {
            heading: { en: "Order, hiding and many at once", zh: "排序、隐藏与批量操作" },
            body: [
              {
                en: "Drag products to reorder them (clear search and filters first). Turn Published off to hide a product without deleting it.",
                zh: "拖动产品即可调整顺序（需先清除搜索和筛选）。关闭“已发布”可隐藏产品而不删除。",
              },
              {
                en: "Tick several products to delete them together. Under More, Export CSV gives you a spreadsheet of the catalogue and Import CSV updates it from one in the same format.",
                zh: "勾选多个产品可批量删除。在“更多”中，“导出 CSV”可得到产品目录表格，“导入 CSV”可用相同格式的表格批量更新。",
              },
            ],
          },
          {
            heading: { en: "Categories", zh: "分类" },
            body: [
              {
                en: "Categories group products the way buyers browse them. Open them from More on the Products page. Deleting a category keeps its products; they just lose that category.",
                zh: "分类按买家的浏览习惯对产品分组，可在“产品”页的“更多”中打开。删除分类不会删除其中的产品，只是这些产品不再属于该分类。",
              },
            ],
          },
        ],
      },
      {
        id: "categories",
        title: { en: "Categories", zh: "分类" },
        summary: {
          en: "Group products the way buyers browse them. Deleting a category keeps its products.",
          zh: "按买家浏览习惯对产品分组。删除分类不会删除其中的产品。",
        },
        paths: ["/categories"],
        sections: [
          {
            heading: { en: "Adding a category", zh: "添加分类" },
            steps: [
              { en: "Press New category.", zh: "点击“新建分类”。" },
              {
                en: "Give it a name in each language, save, then choose it on each product that belongs in it.",
                zh: "填写每种语言的名称并保存，然后在相应产品中选择该分类。",
              },
            ],
          },
        ],
      },
      {
        id: "news",
        title: { en: "News", zh: "资讯" },
        summary: {
          en: "Articles for your site's news page, and Company news: the timeline of exhibitions, visits and press.",
          zh: "网站资讯页的文章，以及“公司动态”：展会、来访和媒体报道的时间线。",
        },
        paths: ["/news"],
        sections: [
          {
            heading: { en: "Writing an article", zh: "撰写文章" },
            steps: [
              { en: "On News, press New article.", zh: "在“资讯”页点击“新建文章”。" },
              {
                en: "Choose a topic, write the title and text in each language and add a cover photo.",
                zh: "选择主题，填写每种语言的标题和正文，并添加封面图。",
              },
              {
                en: "Save as a draft to keep working on it, or publish it to the site.",
                zh: "可存为草稿稍后继续，或直接发布到网站。",
              },
            ],
          },
          {
            heading: { en: "Exhibitions and events", zh: "展会与活动" },
            body: [
              {
                en: "Under Company news, add each exhibition, visit or press mention with its dates and place. Until its last day has passed, an event is marked upcoming — and an upcoming exhibition with a venue and booth number is also featured on your homepage.",
                zh: "在“公司动态”中添加展会、来访或媒体报道，并填写日期和地点。在最后一天结束前，活动会标记为“即将举行”；填写了场馆和展位号的即将举行的展会还会展示在首页上。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "If you only know the year, choose Only the year is known.",
                zh: "如果只知道年份，请选择“只知道年份”。",
              },
            },
          },
        ],
      },
      {
        id: "resources",
        title: { en: "Resources", zh: "资料" },
        summary: {
          en: "Your site's Resources page: buyer guides, the Videos shelf and your certificates and documents.",
          zh: "网站的“资料”页面：选购指南、视频栏，以及证书和文件。",
        },
        paths: ["/resources"],
        sections: [
          {
            heading: { en: "Buyer guides", zh: "选购指南" },
            body: [
              {
                en: "A guide is built from blocks: paragraphs, headings, lists and the capacity table, which fills itself from your product data. Add blocks with Add block and reorder them with the arrows.",
                zh: "指南由内容块组成：段落、标题、列表，以及根据产品数据自动生成的产能表。点击“添加内容块”添加，用箭头调整顺序。",
              },
            ],
          },
          {
            heading: { en: "Videos", zh: "视频" },
            steps: [
              { en: "Press Add video.", zh: "点击“添加视频”。" },
              {
                en: "Paste the YouTube link — the video must be public or unlisted — and write a title saying what it shows.",
                zh: "粘贴 YouTube 链接（视频须为公开或不公开列出），并填写说明视频内容的标题。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "The site shows the video's picture and opens it on YouTube when clicked, because YouTube doesn't load in mainland China.",
                zh: "由于中国大陆无法加载 YouTube，网站会显示视频封面，点击后跳转到 YouTube 观看。",
              },
            },
          },
        ],
      },
      {
        id: "documents",
        title: { en: "Certificates & documents", zh: "证书与文件" },
        summary: {
          en: "The certificates and company documents buyers can open from your Resources page, in groups. Files are copied onto your website, so they open in China too.",
          zh: "买家可在“资料”页打开的证书和公司文件，按组排列。文件会复制到网站上，因此在中国也能打开。",
        },
        paths: ["/resources/documents"],
        sections: [
          {
            heading: { en: "Groups and sections", zh: "分组与板块" },
            body: [
              {
                en: "Certificates for parts holds certificates for the materials and parts a system is built from, grouped by the part they cover. Company and machine documents holds those about your company or a finished machine.",
                zh: "“部件证书”存放系统所用材料和部件的证书，按所覆盖的部件分组；“公司与整机文件”存放关于公司或整机的文件。",
              },
            ],
          },
          {
            heading: { en: "Adding a document", zh: "添加文件" },
            steps: [
              {
                en: "Find the group it belongs in and press Add document under it. If there is no suitable group, press Add group first.",
                zh: "找到所属分组，点击其下方的“添加文件”。如果没有合适的分组，请先点击“添加分组”。",
              },
              {
                en: "Write the document's name as it is printed on it, e.g. NSF certificate.",
                zh: "按文件上印刷的名称填写，例如“NSF 证书”。",
              },
              {
                en: "Press Choose file and pick a PDF, JPG or PNG up to 20 MB, then save and publish.",
                zh: "点击“选择文件”，上传不超过 20 MB 的 PDF、JPG 或 PNG，然后保存并发布。",
              },
            ],
            note: {
              kind: "warning",
              text: {
                en: "Deleting a group removes every document in it from the site.",
                zh: "删除分组会将其中的所有文件从网站上移除。",
              },
            },
          },
        ],
      },
      {
        id: "homepage",
        title: { en: "Homepage", zh: "首页" },
        summary: {
          en: "The headline over your homepage's opening film, the line under it, and the four figures beneath.",
          zh: "首页开场影片上的标题、副标题，以及下方的四个数据。",
        },
        paths: ["/homepage"],
        sections: [
          {
            heading: { en: "The four figures", zh: "四个数据" },
            body: [
              {
                en: "Each figure has a number, a unit, a label, a short explanation and the page it links to, such as /information/. Keep the number short: it counts up as visitors scroll to it. Text that isn't a number, like 近 30, is shown as written.",
                zh: "每个数据包括数字、单位、标签、简短说明以及链接页面（例如 /information/）。数字应尽量简短：访客滚动到此处时会有计数动画。非数字文字（如“近 30”）将按原样显示。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "Every figure should be backed up by the page it links to. Buyers check.",
                zh: "每个数据都应有所链接页面作为依据——买家会核实。",
              },
            },
          },
        ],
      },
      {
        id: "company",
        title: { en: "Company & offices", zh: "公司与办事处" },
        summary: {
          en: "How buyers reach you: the email, phone and WhatsApp printed across the site, the footer address, social accounts, your sales contact and your offices.",
          zh: "买家联系您的方式：网站各处显示的邮箱、电话和 WhatsApp，页脚地址，社交账号，销售联系人以及各办事处。",
        },
        paths: ["/company"],
        sections: [
          {
            heading: { en: "Contact details", zh: "联系方式" },
            body: [
              {
                en: "One change here updates every place the site shows it — the footer, the contact page and the enquiry form. Only owners can edit this page; staff can see it.",
                zh: "在此修改一次，网站上所有显示该信息的位置（页脚、联系页面、询盘表单）都会同步更新。只有所有者可以编辑此页，员工只能查看。",
              },
            ],
          },
          {
            heading: { en: "Offices and maps", zh: "办事处与地图" },
            steps: [
              {
                en: "Press Add office, or the pencil beside an office to edit it.",
                zh: "点击“添加办公地点”，或点击办事处旁的铅笔图标进行编辑。",
              },
              {
                en: "Fill in its name, address and numbers in each language.",
                zh: "填写每种语言的名称、地址和电话。",
              },
              {
                en: "For a map, enter the office's latitude and longitude and turn on Show a district map. The map is drawn when the site is published.",
                zh: "如需地图，请填写办事处的纬度和经度并开启“显示区域地图”。地图会在网站发布时生成。",
              },
            ],
            note: {
              kind: "tip",
              text: {
                en: "To find the coordinates, right-click the building in Google Maps or Amap and copy the two numbers.",
                zh: "获取坐标：在谷歌地图或高德地图中右键点击该建筑，复制显示的两个数字。",
              },
            },
          },
        ],
      },
    ],
  },
  {
    title: { en: "Your workspace", zh: "工作区" },
    topics: [
      {
        id: "history",
        title: { en: "History and undo", zh: "历史记录与撤销" },
        summary: {
          en: "Every change keeps the version before it, and deleted items can be brought back for a while.",
          zh: "每次修改都会保留之前的版本，已删除的内容在一段时间内也可以恢复。",
        },
        paths: [],
        sections: [
          {
            heading: { en: "Going back to an earlier version", zh: "恢复到之前的版本" },
            body: [
              {
                en: "On a product, article or guide, scroll to History. Each earlier version shows how many fields differ from now; press Restore to put it back. In Preview changes, Discard changes returns an item to the version on the live site.",
                zh: "在产品、文章或指南页面中，滚动到“历史版本”。每个旧版本都会显示与当前相比有几处不同，点击“恢复”即可还原。在“预览更改”中，“放弃修改”会将内容恢复为正式网站上的版本。",
              },
            ],
          },
          {
            heading: { en: "Recently deleted", zh: "最近删除" },
            body: [
              {
                en: "In Settings, Recently deleted lists products, articles, guides and categories deleted lately. Restore brings one back exactly as it was. Restored items go live when you publish.",
                zh: "在“设置”的“最近删除”中，可以看到近期删除的产品、文章、指南和分类。点击“恢复”即可原样找回。恢复的内容在发布后上线。",
              },
            ],
          },
        ],
      },
      {
        id: "team",
        title: { en: "Team and roles", zh: "团队与角色" },
        summary: {
          en: "Who can sign in to this dashboard. Owners can do everything; staff edit content but can't publish or change settings.",
          zh: "可以登录后台的人员。所有者拥有全部权限；员工可以编辑内容，但不能发布或更改设置。",
        },
        paths: ["/team"],
        sections: [
          {
            heading: { en: "Owners and staff", zh: "所有者与员工" },
            body: [
              {
                en: "Only owners can publish, edit Company details and workspace settings, delete enquiries and manage the team.",
                zh: "只有所有者可以发布、编辑公司信息和工作区设置、删除询盘以及管理团队。",
              },
            ],
          },
          {
            heading: { en: "Adding a teammate", zh: "添加团队成员" },
            steps: [
              {
                en: "In Settings, open Team and press Add member.",
                zh: "在“设置”中打开“团队”，点击“添加成员”。",
              },
              {
                en: "Enter their email, a temporary password and their role.",
                zh: "填写对方的邮箱、临时密码和角色。",
              },
              {
                en: "No invitation email is sent: give them the password yourself and ask them to change it after signing in.",
                zh: "系统不会发送邀请邮件：请直接把密码告诉对方，并请其登录后修改。",
              },
            ],
          },
        ],
      },
      {
        id: "settings",
        title: { en: "Settings and your account", zh: "设置与账户" },
        summary: {
          en: "Your workspace details, where enquiry emails go, your profile and password, two-factor sign-in and the activity log.",
          zh: "工作区信息、询盘通知邮箱、个人资料与密码、双重认证以及操作记录。",
        },
        paths: ["/settings"],
        sections: [
          {
            heading: { en: "Enquiry emails", zh: "询盘通知邮箱" },
            body: [
              {
                en: "Every new enquiry is emailed to the addresses under Enquiry notification emails. Separate several with commas; leave it empty to use your sign-in email.",
                zh: "每条新询盘都会发送到“询盘通知邮箱”中填写的地址。多个地址请用逗号分隔；留空则发送到您的登录邮箱。",
              },
            ],
          },
          {
            heading: { en: "Keeping your account safe", zh: "保护账户安全" },
            body: [
              {
                en: "Turn on two-factor authentication to ask for a code from an authenticator app at every sign-in. Save the recovery codes it shows you somewhere safe — they are shown only once.",
                zh: "开启双重认证后，每次登录都需要输入身份验证器应用中的验证码。请妥善保存显示的恢复码——它们只会显示一次。",
              },
              {
                en: "Forgot your password? Press Reset password on the sign-in page and follow the emailed link.",
                zh: "忘记密码？在登录页点击“重置密码”，按邮件中的链接操作即可。",
              },
            ],
          },
          {
            heading: { en: "Activity log", zh: "操作记录" },
            body: [
              {
                en: "The activity log shows who changed what, and when.",
                zh: "操作记录会显示谁在什么时间修改了什么内容。",
              },
            ],
          },
        ],
      },
      {
        id: "faq",
        title: { en: "Common questions", zh: "常见问题" },
        summary: {
          en: "Quick answers when something doesn't look right.",
          zh: "遇到问题时的快速解答。",
        },
        paths: ["/help"],
        sections: [
          {
            heading: { en: "I saved, but the website hasn't changed", zh: "已经保存，但网站没有变化" },
            body: [
              {
                en: "Saved changes go live only when an owner publishes. After publishing, allow a minute or two, then refresh the website.",
                zh: "保存的修改需由所有者发布后才会上线。发布后请等待一两分钟，再刷新网站。",
              },
            ],
          },
          {
            heading: { en: "A page shows English in another language", zh: "其他语言页面显示的是英文" },
            body: [
              {
                en: "That field is empty in that language. Pick the language in the Writing in bar, fill it in, save and publish.",
                zh: "该字段在此语言中为空。请在“编辑语言”栏中选择该语言，填写后保存并发布。",
              },
            ],
          },
          {
            heading: { en: "An upload failed", zh: "上传失败" },
            body: [
              {
                en: "Check the file type and size: photos as JPG or PNG; documents as PDF, JPG or PNG up to 20 MB. Then try again.",
                zh: "请检查文件类型和大小：照片为 JPG 或 PNG；文件为不超过 20 MB 的 PDF、JPG 或 PNG。然后重试。",
              },
            ],
          },
          {
            heading: { en: "I deleted something by mistake", zh: "误删了内容" },
            body: [
              {
                en: "Open Settings and look under Recently deleted. Enquiries can't be restored once deleted.",
                zh: "打开“设置”，在“最近删除”中查找并恢复。询盘删除后无法恢复。",
              },
            ],
          },
          {
            heading: { en: "Still stuck?", zh: "仍未解决？" },
            body: [
              {
                en: "Contact your STEEZ team at team@steez.digital. Tell us the page you were on and what you expected to happen.",
                zh: "请联系 STEEZ 团队：team@steez.digital。请告诉我们您所在的页面以及期望的结果。",
              },
            ],
          },
        ],
      },
    ],
  },
];

export const ALL_TOPICS: HelpTopic[] = MANUAL.flatMap((c) => c.topics);

/** The topic explaining a dashboard route, or null. "/products/[id]/edit"
    matches "/products"; "[id]" in a topic path matches any one segment. */
export function topicForPath(pathname: string): HelpTopic | null {
  const segs = pathname.replace(/\/+$/, "").split("/").filter(Boolean);
  let best: { topic: HelpTopic; len: number } | null = null;
  for (const topic of ALL_TOPICS) {
    for (const p of topic.paths) {
      const want = p.split("/").filter(Boolean);
      // "/" only matches the Overview page itself.
      if (want.length === 0 && segs.length !== 0) continue;
      if (want.length > segs.length) continue;
      if (!want.every((w, i) => w === "[id]" || w === segs[i])) continue;
      if (!best || want.length > best.len) best = { topic, len: want.length };
    }
  }
  return best?.topic ?? null;
}
