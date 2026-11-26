export const DEFAULT_CATEGORIES = [
  '前端与 UI 设计',
  '设计工具 (Figma/Canva/Mobbin)',
  '浏览器与逆向调试',
  '写作与表达优化',
  'Firebase 与后端云服务',
  'Android 与移动端',
  'Gemini AI 开发',
  '效率与云盘工具',
  '系统编排与协作',
];

export const CATEGORY_EN_MAP = {
  '前端与 UI 设计': 'Frontend & UI Design',
  '设计工具 (Figma/Canva/Mobbin)': 'Design Platforms (Figma/Canva/Mobbin)',
  '浏览器与逆向调试': 'Browser & Reverse Engineering',
  '写作与表达优化': 'Writing & Copy Polishing',
  'Firebase 与后端云服务': 'Firebase & Backend Cloud',
  'Android 与移动端': 'Android & Mobile Dev',
  'Gemini AI 开发': 'Gemini AI Development',
  '效率与云盘工具': 'Productivity & Cloud Drive',
  '系统编排与协作': 'System & Agent Orchestration',
  '未分类': 'Uncategorized',
};

export const DEFAULT_SETTINGS = {
  language: 'zh', // 'zh' | 'en'
  density: 'standard', // 'compact' | 'standard' | 'comfortable'
  groupSpacing: 'wide', // 'normal' | 'wide'
  descLines: '2', // '2' | '4' | 'all'
  defaultView: 'grouped', // 'grouped' | 'flat'
  defaultGroupState: 'expanded', // 'expanded' | 'collapsed'
  pluginFoldRule: 'auto', // 'auto' | 'always_collapsed' | 'always_expanded'
  hideDisabled: false,
  showBuiltin: true,
  showPlugin: true,
  autoDiscoverOnFocus: true,
  promptTemplateZh: '请使用 {{name}} skill 来帮我处理：',
  promptTemplateEn: 'Please use the {{name}} skill to help me with: ',
  extraSkillDirs: [],
};

export const DEFAULT_SKILL_META = {
  // 1. 前端与 UI 设计
  'ui-ux-pro-max': {
    category: '前端与 UI 设计',
    defaultNote: 'UI/UX 设计智能知识库：内置行业配色、字体搭配、79 种界面风格与本地检索脚本，写前端前先生成设计系统。',
  },
  'snow-glass-ui': {
    category: '前端与 UI 设计',
    defaultNote: '雪境液态玻璃（Snow-Glass）极简高反差 UI 设计规范：黑白骨架、五色折射光场、点阵背景与双高光玻璃材质。',
  },
  'ui-styling': {
    category: '前端与 UI 设计',
    defaultNote: '基于 shadcn/ui（Radix UI）与 Tailwind CSS 的现代组件样式与暗黑模式规范。',
  },
  'design-system': {
    category: '前端与 UI 设计',
    defaultNote: '三层设计 Token 架构（Primitive → Semantic → Component）、CSS 变量体系与组件规格文档生成。',
  },
  'design': {
    category: '前端与 UI 设计',
    defaultNote: '综合品牌与视觉设计套件：品牌识别、Logo 思路、企业形象（CIP）模板、社交媒体图与多平台视觉物料。',
  },
  'brand': {
    category: '前端与 UI 设计',
    defaultNote: '品牌调性、视觉识别规范、话术框架与品牌一致性检查。',
  },
  'banner-design': {
    category: '前端与 UI 设计',
    defaultNote: '社交平台封面、广告图、官网 Hero 横幅与海报排版设计指南。',
  },
  'slides': {
    category: '前端与 UI 设计',
    defaultNote: '结合 Chart.js 图表与设计 Token 制作响应式 HTML 战略演示文稿/PPT。',
  },
  'generative_ui': {
    category: '前端与 UI 设计',
    defaultNote: '在对话或独立 Artifact 中生成交互式 HTML 图表、原理演示控件与富可视化组件。',
  },
  'emil-design-eng': {
    category: '前端与 UI 设计',
    defaultNote: 'Emil Kowalski 设计工程核心哲学：打磨交互微细节（按压/悬停态、弹出锚点、提示延迟、过渡与裁剪动效）。',
  },
  'animate': {
    category: '前端与 UI 设计',
    defaultNote: '从零构建 Web 动效：按决策顺序判断该不该动、用什么属性/曲线/时长、如何响应中断与退场并编写实现。',
  },
  'choreograph': {
    category: '前端与 UI 设计',
    defaultNote: '多元素协同动效编排：控制交错列表、Hero 入场、容器视图切换与 AnimatePresence 编排节奏，消除机械感。',
  },
  'gestures': {
    category: '前端与 UI 设计',
    defaultNote: '构建跟手 1:1 拖拽、滑动、抛投、下拉刷新与可中断抽屉/Sheet 交互，解决掉帧回跳问题。',
  },
  'animation-performance': {
    category: '前端与 UI 设计',
    defaultNote: 'Web 动效性能排障：坚守合成层属性、避开主线程阻塞、合理选用 CSS/JS 动效与 will-change。',
  },
  'animation-vocabulary': {
    category: '前端与 UI 设计',
    defaultNote: '动效术语反查词典：把“像橡皮筋一样回弹”等口语描述翻译成专业动效术语（如 Rubber-banding、Pop in）。',
  },
  'apple-design': {
    category: '前端与 UI 设计',
    defaultNote: '将 Apple 流体物理交互与设计质感（弹簧动效、半透明材质景深、视觉字号与克制反馈）移植到 Web 界面。',
  },
  'ask-emil': {
    category: '前端与 UI 设计',
    defaultNote: 'Emil 技能套件路由器：根据你当前的界面或动效问题，帮你挑选最匹配的子技能与处理流程。',
  },
  'ask-sonner': {
    category: '前端与 UI 设计',
    defaultNote: 'React 通知组件库 Sonner 实战指南：Toaster 接入、Promise 加载态、主题样式定制与弹窗层级排查。',
  },
  'break-ui': {
    category: '前端与 UI 设计',
    defaultNote: 'UI 极限压力测试：用超长名、无换行邮箱、零/超大数值与多语言混排破坏界面，生成 Demo 开关并定位修复。',
  },
  'find-animation-opportunities': {
    category: '前端与 UI 设计',
    defaultNote: '只读巡检代码库，找出“该加动效的地方”并拒绝多余动效，输出带具体参数的动效改进方案。',
  },
  'improve-animations': {
    category: '前端与 UI 设计',
    defaultNote: '以资深动效顾问视角全面体检项目动效代码，生成按优先级排序的改进路线图与实施计划。',
  },
  'review-animations': {
    category: '前端与 UI 设计',
    defaultNote: '按 Emil Kowalski 设计工程高标准严格审查动效代码改动，默认挑毛病直到达标。',
  },
  'remove-animations': {
    category: '前端与 UI 设计',
    defaultNote: '专做动效减法：清掉键盘高频操作、纯功能数据与无意义装饰的拖慢动画，并清理遗留代码。',
  },
  'learn-taste': {
    category: '前端与 UI 设计',
    defaultNote: '把当前会话中改过的审美与设计纠偏沉淀成永久规则（写入 DESIGN.md、项目 Skill 或 lint 检查）。',
  },
  'mobile-native': {
    category: '前端与 UI 设计',
    defaultNote: '让手机网页拥有原生 App 手感：解决粘滞 hover、100vh、输入框放大、刘海安全区、长按误选与滚动劫持。',
  },
  'pick-ui-library': {
    category: '前端与 UI 设计',
    defaultNote: '前端 UI 库选型指南：为原语组件、Toast、抽屉、命令面板、图表、虚拟列表和拖拽挑选靠谱库。',
  },
  'prototype': {
    category: '前端与 UI 设计',
    defaultNote: '同一界面需求同时做出多个风格迥异的可交互原型，挂在切换器后供你实时对比挑选最优解。',
  },

  // 2. 设计工具 (Figma / Canva / Mobbin)
  'figma-use': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '调用 Figma `use_figma` 工具的前置必读规范：安全执行画布脚本、创建/修改节点、自动布局与变量绑定。',
  },
  'figma-design-to-code': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Figma 设计稿转前端代码（调用 `get_design_context` 前必读）：还原像素级布局、样式与组件结构。',
  },
  'figma-generate-design': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '把现有代码页面、弹窗或需求描述分段构建为可编辑的 Figma 设计稿，复用设计系统 Token。',
  },
  'figma-generate-library': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '从代码库反向在 Figma 中搭建完整设计系统（Variables、浅/深色主题、组件变体集）。',
  },
  'figma-generate-diagram': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '在 FigJam 中生成流程图、系统架构图、时序图、ER 图与状态机（调用 `generate_diagram` 前必读）。',
  },
  'figma-create-new-file': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '创建新的 Figma Design、FigJam 或 Slides 文件前的规范检查（调用 `create_new_file` 前必读）。',
  },
  'figma-code-connect': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '创建与维护 `.figma.ts` / `.figma.js` Code Connect 映射，关联 Figma 组件与代码仓库组件。',
  },
  'figma-code-workflows': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '将本地 HTML 或项目代码导入 Figma，转为可编辑设计图层、可运行代码层或 Make 文件。',
  },
  'figma-swiftui': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'SwiftUI 与 Figma 双向转换：把 Figma 转成 iOS SwiftUI 代码，或把 SwiftUI 视图同步回 Figma。',
  },
  'figma-implement-motion': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '将 Figma 里的动效与过渡参数还原为生产环境前端动画代码。',
  },
  'figma-use-motion': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '通过 `use_figma` 为 Figma 节点添加、修改或查看关键帧、缓动曲线与时间轴动画。',
  },
  'figma-3d-transforms': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '在 Figma 中添加或编辑 3D 透视、景深、Z 轴旋转、等距视角与视差效果。',
  },
  'figma-shaders': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '编写或修改 Figma 自定义着色器（Shader）效果与程序化填充（调用 shader 工具前必读）。',
  },
  'figma-generative-plugins': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '开发与修改可复用的生成式 Figma 插件（调用插件创建工具前必读）。',
  },
  'figma-spec': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '读取、撰写、审阅或评论独立或内嵌的 Figma Specs（PRD / 技术方案文档）。',
  },
  'figma-use-figjam': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '配合 `figma-use` 在 FigJam 白板中创建便利贴、连线、分组与白板元素。',
  },
  'figma-use-slides': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '配合 `figma-use` 在 Figma Slides 幻灯片中编辑页面与演示内容。',
  },
  'canva-cli': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '使用 Canva CLI（`canva api`）调用 Canva REST API 管理设计与素材。',
  },
  'canva-edit-design': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '修改已有 Canva 设计稿中的文案、替换图片/视频或调整版面元素。',
  },
  'canva-design-feedback': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '审阅 Canva 设计稿并从视觉层级、文案表达和排版角度给出结构化优化建议。',
  },
  'canva-implement-feedback': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '读取 Canva 设计稿上的评论批注，汇总修改意见并自动落地到设计中。',
  },
  'canva-brand-check': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '对照品牌规范套件检查 Canva 设计是否出现偏色、字体违规或排版偏差。',
  },
  'canva-bulk-create': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '用表格数据批量填充 Canva 品牌模板，一次性生成多份多渠道海报/素材。',
  },
  'canva-resize-for-social-media': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '把已有 Canva 营销海报一键适配并调整为各大社交平台的尺寸变体。',
  },
  'search': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Mobbin 搜索优化指南：精准检索 60 万+真实上架 App 截图与交互流程参考。',
  },
  'best-practices': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Mobbin 技能最佳实践总览：说明 Mobbin 能做什么、各技能如何配合。',
  },
  'redesign-screen': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: '基于 Mobbin 真实成熟产品界面模式，按你的设计系统重构现有页面截图或代码。',
  },
  'plain-writing': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Mobbin 界面分析报告专用“大白话”输出规范，让设计评审报告通俗易懂。',
  },

  // 3. 浏览器与逆向调试
  'ego-browser': {
    category: '浏览器与逆向调试',
    defaultNote: '调用本地 Ego Lite 桌面浏览器复用已登录账号状态，隔离执行网页自动化、抓数据、填表与 QA 测试。',
  },
  'chrome-devtools': {
    category: '浏览器与逆向调试',
    defaultNote: '通过 Chrome DevTools MCP 操控页面、抓取网络请求、控制台报错与性能剖析。',
  },
  'a11y-debugging': {
    category: '浏览器与逆向调试',
    defaultNote: '使用 Chrome DevTools 检查网页无障碍（a11y）、ARIA 标签、焦点顺序、触控区与颜色对比度。',
  },
  'cookie-debugging': {
    category: '浏览器与逆向调试',
    defaultNote: '排查网页 Cookie、SameSite、401/403 鉴权失败、登录态丢失与跳转异常。',
  },
  'debug-optimize-lcp': {
    category: '浏览器与逆向调试',
    defaultNote: '诊断并优化网页核心指标 LCP（最大内容绘制），定位首屏加载瓶颈。',
  },
  'memory-leak-debugging': {
    category: '浏览器与逆向调试',
    defaultNote: '对比与分析 Chrome/Node.js 堆快照，定位前端或 Node 服务的内存泄漏。',
  },
  'troubleshooting': {
    category: '浏览器与逆向调试',
    defaultNote: '排查 Chrome DevTools MCP 连接失败、`list_pages`/`navigate_page` 异常问题。',
  },
  'reverse-engineer-anything': {
    category: '浏览器与逆向调试',
    defaultNote: '使用 REA 对原生二进制、Electron/JS 打包、APK、固件、抓包或 Web 应用做静态+动态逆向取证。',
  },
  'craft-anything': {
    category: '浏览器与逆向调试',
    defaultNote: '通过 Craft Anything 系统性调查已发布软件的工作原理，沉淀证据链、假设与可复刻报告。',
  },

  // 4. 写作与表达优化
  'shuorenhua': {
    category: '写作与表达优化',
    defaultNote: '中文/英文“说人话”去 AI 味审稿与改写：清掉套话和翻译腔，同时严格保住数字、术语、代码和责任主体。',
  },

  // 5. Firebase 与后端云服务
  'firebase-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: 'Firebase CLI 登录、创建/切换项目以及下载 iOS/Android 应用配置文件。',
  },
  'firebase-firestore': {
    category: 'Firebase 与后端云服务',
    defaultNote: 'Cloud Firestore 数据库建模、索引管理、查询与多端 SDK 集成。',
  },
  'firebase-auth-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '接入与配置 Firebase Authentication 用户登录与身份鉴权。',
  },
  'firebase-hosting-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '部署经典静态网站与 SPA 到 Firebase Hosting，配置路由重写与自定义域名。',
  },
  'firebase-app-hosting-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '部署 Next.js / Angular 等全栈 SSR 应用到 Firebase App Hosting。',
  },
  'firebase-data-connect': {
    category: 'Firebase 与后端云服务',
    defaultNote: '基于 PostgreSQL 构建与部署 Firebase Data Connect 关系型后端与类型安全 SDK。',
  },
  'firebase-ai-logic-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '在 Web 应用中安全集成 Firebase AI Logic（客户端调用 Gemini API 与多模态推理）。',
  },
  'firebase-crashlytics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '配置与集成 Firebase Crashlytics 移动端崩溃日志收集。',
  },
  'firebase-remote-config-basics': {
    category: 'Firebase 与后端云服务',
    defaultNote: '管理 Firebase Remote Config 远程参数模板、灰度功能开关与客户端拉取策略。',
  },
  'firebase-security-rules-auditor': {
    category: 'Firebase 与后端云服务',
    defaultNote: '红队审计 Firestore / Storage 安全规则，排查越权读写、角色绕过与字段校验漏洞。',
  },
  'firestore-rules-creation': {
    category: 'Firebase 与后端云服务',
    defaultNote: '编写与加固生产级 `firestore.rules` 安全规则。',
  },
  'extension-to-functions-codebase': {
    category: 'Firebase 与后端云服务',
    defaultNote: '把已安装的 Firebase Extension 源码转换为独立的 Cloud Functions 代码库。',
  },
  'base44-cli': {
    category: 'Firebase 与后端云服务',
    defaultNote: '使用 Base44 CLI 管理全栈项目实体、认证、后端函数与部署发布。',
  },
  'base44-sdk': {
    category: 'Firebase 与后端云服务',
    defaultNote: '在前端/脚本中通过 Base44 JS/TS SDK 读写 Base44 服务接口。',
  },
  'base44-troubleshooter': {
    category: 'Firebase 与后端云服务',
    defaultNote: '查看 Base44 后端函数日志与工作流执行记录，排查线上报错。',
  },

  // 6. Android 与移动端
  'android-cli': {
    category: 'Android 与移动端',
    defaultNote: '使用 `android` CLI 创建 Android 项目、管理模拟器、截屏与界面检查。',
  },
  'android-device-hub': {
    category: 'Android 与移动端',
    defaultNote: '管理 Android 虚拟设备（AVD）与真机镜像投屏控制。',
  },
  'compose-preview': {
    category: 'Android 与移动端',
    defaultNote: '渲染与预览 Android Jetpack Compose 的 `@Preview` 界面组件。',
  },
  'xcode-project-setup': {
    category: 'Android 与移动端',
    defaultNote: '安全修改 Xcode 项目（`.pbxproj`）以添加 Swift Packages 依赖并链接库文件。',
  },
  'animate-expo': {
    category: 'Android 与移动端',
    defaultNote: 'React Native / Expo 原生级动效开发：用 Reanimated、Gesture Handler 与 expo-haptics 打造不掉帧手势动画。',
  },
  'write-swift': {
    category: 'Android 与移动端',
    defaultNote: '现代 Swift 6 工程规范：值类型建模、数据竞争安全并发（actors/@concurrent）、泛型、ARC 性能与 Swift Testing。',
  },

  // 7. Gemini AI 开发
  'gemini-api-dev': {
    category: 'Gemini AI 开发',
    defaultNote: '使用最新 `google-genai` / `@google/genai` SDK 编写文本、多模态、工具调用与结构化输出代码。',
  },
  'gemini-api-cli': {
    category: 'Gemini AI 开发',
    defaultNote: '直接在命令行用 `gemini-api` 调用 Gemini 能力（生图、TTS、音视频理解、Deep Research）。',
  },
  'gemini-live-api-dev': {
    category: 'Gemini AI 开发',
    defaultNote: '开发基于 WebSocket 双向实时音视频流对话的 Gemini Live API 应用。',
  },
  'gemini-omni-flash-api': {
    category: 'Gemini AI 开发',
    defaultNote: '使用 Gemini Omni 1.2 Flash 进行生成式视频编辑、文生视频、首尾帧过渡与视频延长。',
  },
  'genie-4-live-world': {
    category: 'Gemini AI 开发',
    defaultNote: '使用 Genie 4 构建实时交互式可操控世界模拟（WebRTC/WebSocket 流式视频+动作控制）。',
  },
  'retrieving-developer-knowledge': {
    category: 'Gemini AI 开发',
    defaultNote: '检索 Google 官方开发者知识库文档（GCP、Gemini、Android、Firebase、Flutter 等最新语法）。',
  },

  // 8. 效率与云盘工具
  'gdrive': {
    category: '效率与云盘工具',
    defaultNote: '浏览、搜索、上传、下载、导出与管理 Google Drive 网盘文件与共享权限。',
  },
  'automation': {
    category: '效率与云盘工具',
    defaultNote: '交互式设计并创建定时或周期性后台自动化任务（对应 `/automation`）。',
  },

  // 9. 系统编排与协作
  'agy-customizations': {
    category: '系统编排与协作',
    defaultNote: 'Antigravity 自定义体系参考：Skill、Rule、Plugin、Hook 与 MCP 的目录位置、加载优先级与配置写法。',
  },
  'antigravity-guide': {
    category: '系统编排与协作',
    defaultNote: 'Google Antigravity 综合使用说明书（IDE、CLI、SDK、斜杠命令、快捷键与扩展机制）。',
  },
  'plugin': {
    category: '系统编排与协作',
    defaultNote: '管理与打包 Antigravity 插件（启用/禁用/卸载、商店安装、把松散能力打包成插件）。',
  },
  'mcp-app-development': {
    category: '系统编排与协作',
    defaultNote: '开发与调试 Antigravity 的 MCP App（带内嵌/侧边栏/全局交互式 HTML 面板的 MCP 工具）。',
  },
  'ui-plugin-navigation': {
    category: '系统编排与协作',
    defaultNote: '发现当前任务相关的 UI 插件面板，并在对话中给出快捷打开按钮。',
  },
  'conversations': {
    category: '系统编排与协作',
    defaultNote: '通过本地 HTTP 接口管理 Antigravity 会话（新建、列表、重命名、置顶、归档、删除）。',
  },
  'run-workflow': {
    category: '系统编排与协作',
    defaultNote: '编写并执行 Python 编排脚本（`run_workflow`），控制多 Agent 并发扇出、流水线与结果聚合。',
  },
  'swarm': {
    category: '系统编排与协作',
    defaultNote: '多 Agent 蜂群协作（`/swarm`）调度规范：分配独立工作区分支、看板通信与状态协同。',
  },
  'swarm_monitor': {
    category: '系统编排与协作',
    defaultNote: 'Swarm 监控者专用技能：定时巡检多 Agent 蜂群是否卡死并唤醒对应成员。',
  },
  'swarm_narrator': {
    category: '系统编排与协作',
    defaultNote: 'Swarm 播报员专用技能：整理多 Agent 协同进度汇报给协调者。',
  },
  'swarm_pane': {
    category: '系统编排与协作',
    defaultNote: 'Swarm 协调者专用技能：维护 Swarm UI 概览面板的目标、分组与截图时间线。',
  },
  'migrate-agent-settings': {
    category: '系统编排与协作',
    defaultNote: '把 Claude Code、Codex、Cursor、Gemini CLI 的配置一键迁移打包成 Antigravity 插件。',
  },
  'migrate-workflows': {
    category: '系统编排与协作',
    defaultNote: '将旧版 Workflows 迁移转换为新版 `SKILL.md` 并自动归档旧文件。',
  },
  'permissioned-github': {
    category: '系统编排与协作',
    defaultNote: 'GitHub 命令行操作权限与授权引导规范（遇到权限或登录受阻时如何处理）。',
  },
};

export const DEFAULT_MCP_META = {
  'rea': {
    category: '浏览器与逆向调试',
    defaultNote: 'Reverse Engineer Anything (REA) 逆向分析 MCP：提供反编译、Frida/ADB/Rizin 调试、网络抓包与桌面/Web 逆向能力。',
    defaultNoteEn: 'Reverse Engineer Anything (REA) MCP server for decompilation, Frida/ADB/Rizin debugging, packet capture, and desktop/web RE.',
  },
  'craft-anything': {
    category: '浏览器与逆向调试',
    defaultNote: 'Craft Anything 软件调查 MCP：管理调查简报、假设、证据链与发现报告，用于分析已发布软件原理。',
    defaultNoteEn: 'Craft Anything investigation MCP for managing evidence chains, hypotheses, and architecture reports on shipped software.',
  },
  'skill-mcp-manager': {
    category: '系统编排与协作',
    defaultNote: 'Antigravity Skill & MCP 管理面板本身：扫描本地与插件技能、管理分类群组、排序与自定义备注。',
    defaultNoteEn: 'Antigravity Skill & MCP Manager itself: auto-discovers skills/MCPs, manages groups, ordering, custom notes, and toggles.',
  },
  'figma': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Figma 官方远程 MCP Server：读取 Figma 设计稿上下文、生成设计图与 FigJam 图表、提取设计 Token。',
    defaultNoteEn: 'Official Figma remote MCP server for reading design context, generating diagrams/designs, and extracting variables.',
  },
  'canva': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Canva 官方远程 MCP Server：创建、编辑、批量生成、品牌检查与缩放 Canva 设计作品。',
    defaultNoteEn: 'Official Canva remote MCP server for creating, editing, bulk-generating, brand-checking, and resizing designs.',
  },
  'mobbin': {
    category: '设计工具 (Figma/Canva/Mobbin)',
    defaultNote: 'Mobbin 远程 MCP Server：按产品类型和页面模式搜索海量真实 App 截图与用户流程灵感。',
    defaultNoteEn: 'Mobbin remote MCP server for searching 600,000+ real app screenshots and UX flows.',
  },
  'gemini-api-docs': {
    category: 'Gemini AI 开发',
    defaultNote: 'Gemini API 官方文档检索 MCP：查询最新 SDK 接口、模型能力、代码示例与迁移指南。',
    defaultNoteEn: 'Official Gemini API documentation MCP server for querying current SDK references and guides.',
  },
  'google-developer-knowledge': {
    category: 'Gemini AI 开发',
    defaultNote: 'Google 开发者官方知识库 MCP：检索 GCP、Firebase、Android、Flutter 等权威文档。',
    defaultNoteEn: 'Google Developer Knowledge MCP server covering GCP, Firebase, Android, Flutter, and Web docs.',
  },
  'host': {
    category: '系统编排与协作',
    defaultNote: 'Usage & Speed Monitor 插件的本地 MCP Server：提供生成速度、首字延迟、上下文与额度监控面板。',
    defaultNoteEn: 'Usage & Speed Monitor local MCP server displaying token throughput, TTFT, context usage, and quotas.',
  },
};

export function inferCategory(name, desc = '', pluginName = '') {
  const text = `${name} ${pluginName} ${desc}`.toLowerCase();
  if (/(figma|canva|mobbin)/.test(text)) return '设计工具 (Figma/Canva/Mobbin)';
  if (/(ui|ux|css|tailwind|design|slide|banner|brand|glass|animate|choreograph|gesture|sonner|emil)/.test(text)) return '前端与 UI 设计';
  if (/(browser|playwright|puppeteer|devtools|debug|reverse|craft|a11y|cookie|lcp|memory-leak|frida|rizin|gdb)/.test(text)) return '浏览器与逆向调试';
  if (/(write|writing|shuoren|humaniz|slop|flavor|审稿|去 ai)/.test(text)) return '写作与表达优化';
  if (/(firebase|firestore|base44|postgres|mysql|sqlite|supabase|redis|mongo|prisma|sql|database)/.test(text)) return 'Firebase 与后端云服务';
  if (/(android|compose|xcode|swift|ios|flutter|expo)/.test(text)) return 'Android 与移动端';
  if (/(gemini|genie|developer-knowledge|llm|openai|anthropic|embedding|rag)/.test(text)) return 'Gemini AI 开发';
  if (/(gdrive|drive|automation|schedule|n8n|notion|slack|discord|feishu|lark|jira|linear|calendar|gmail|workflow|search|tavily|fetch|github)/.test(text)) return '效率与云盘工具';
  if (/(swarm|workflow|plugin|mcp|agy|antigravity|conversation|migrate|filesystem|shell|terminal|docker|context7|memory)/.test(text)) return '系统编排与协作';
  return '未分类';
}

export function buildAutoMcpNote({
  name,
  pluginDescription = '',
  toolNames = [],
  toolDescriptions = [],
  instructionsSnippet = '',
  endpoint = '',
  lang = 'zh',
}) {
  const parts = [];
  if (pluginDescription) {
    parts.push(pluginDescription.trim());
  } else if (instructionsSnippet) {
    parts.push(instructionsSnippet.trim());
  } else if (toolDescriptions.length > 0) {
    parts.push(toolDescriptions[0].trim());
  }

  if (lang === 'en') {
    const toolSummary = toolNames.length > 0
      ? `${toolNames.length} tools (${toolNames.slice(0, 4).join(', ')}${toolNames.length > 4 ? ', ...' : ''})`
      : '';
    if (parts.length > 0) {
      const clean = parts.join('; ').replace(/\s+/g, ' ').slice(0, 140);
      return `Auto-discovered${toolSummary ? ` · ${toolSummary}` : ''}: ${clean}`;
    }
    if (toolSummary) {
      return `Auto-discovered MCP (${toolSummary})${endpoint ? ` · ${endpoint}` : ''}`;
    }
    return endpoint ? `Auto-discovered MCP (${endpoint})` : `Auto-discovered MCP: ${name}`;
  }

  const toolSummary = toolNames.length > 0
    ? `含 ${toolNames.length} 个工具（${toolNames.slice(0, 4).join('、')}${toolNames.length > 4 ? ' 等' : ''}）`
    : '';

  if (parts.length > 0) {
    const clean = parts.join('；').replace(/\s+/g, ' ').slice(0, 140);
    return `自动识别${toolSummary ? ` · ${toolSummary}` : ''}：${clean}`;
  }
  if (toolSummary) {
    return `自动识别 MCP（${toolSummary}）${endpoint ? ` · 入口：${endpoint}` : ''}`;
  }
  return endpoint ? `自动识别 MCP 服务（入口：${endpoint}）` : `自动识别 MCP 服务：${name}`;
}
