import type { ThemeMode } from './theme'

export type PrimaryNavItem = {
  english: string
  href: string
  label: string
}

export type PlatformSurfaceCopy = {
  description: string
  english: string
  href?: string
  id: 'writing' | 'projects' | 'knowledge' | 'labs'
  label: string
  marker: string
  reserved?: boolean
  signal: string
  status: string
}

type ThemeOptionCopy = {
  ariaLabel: string
  description: string
  id: ThemeMode
  label: string
  shortLabel: string
}

const primaryNavigation = [
  {
    english: 'Writing',
    href: '/articles',
    label: '写作',
  },
  {
    english: 'Projects',
    href: '/projects',
    label: '项目',
  },
  {
    english: 'Knowledge',
    href: '/knowledge',
    label: '知识路径',
  },
  {
    english: 'Labs',
    href: '/labs',
    label: '实验室',
  },
  {
    english: 'About',
    href: '/about',
    label: '关于',
  },
] satisfies readonly PrimaryNavItem[]

const platformSurfaces = [
  {
    description: '长文、札记和可以慢慢展开的论证，优先服务中文阅读。',
    english: 'Writing',
    href: '/articles',
    id: 'writing',
    label: '写作',
    marker: '01',
    signal: 'Essays / Notes',
    status: '已开放',
  },
  {
    description: '作品、系统、实验记录和复盘，用证据展示真正做过的东西。',
    english: 'Projects',
    href: '/projects',
    id: 'projects',
    label: '项目',
    marker: '02',
    signal: 'Artifacts / Systems',
    status: '已开放',
  },
  {
    description: '围绕研究、备考和长期主题的路径入口，先预留清晰边界。',
    english: 'Knowledge Paths',
    href: '/knowledge',
    id: 'knowledge',
    label: '知识路径',
    marker: '03',
    reserved: true,
    signal: 'Maps / Study',
    status: '预留入口',
  },
  {
    description: '小工具、AI demo 和更有弹性的试验场，但不挤压核心内容模型。',
    english: 'Labs',
    href: '/labs',
    id: 'labs',
    label: '实验室',
    marker: '04',
    reserved: true,
    signal: 'Tools / Experiments',
    status: '预留入口',
  },
] satisfies readonly PlatformSurfaceCopy[]

const themeOptions = [
  {
    ariaLabel: '跟随系统主题',
    description: '根据访客系统设置自动选择亮色或暗色。',
    id: 'system',
    label: '系统',
    shortLabel: '系统',
  },
  {
    ariaLabel: '使用暗色主题',
    description: '使用 Myshkin 451 的暗色公共界面。',
    id: 'dark',
    label: '暗色',
    shortLabel: '暗',
  },
  {
    ariaLabel: '使用亮色主题',
    description: '使用适合长时间阅读的亮色界面。',
    id: 'light',
    label: '亮色',
    shortLabel: '亮',
  },
] satisfies readonly ThemeOptionCopy[]

export const uiCopy = {
  home: {
    aboutPreview: {
      body: '它不是简历页，也不是把旧博客换一层皮。Myshkin 451 会把公开表达、项目证据和长期知识整理放在同一个系统里，允许它们互相引用、互相修正。',
      eyebrow: 'About',
      linkLabel: '阅读关于页面',
      title: '这个平台由一个持续学习、写作和造工具的人维护。',
    },
    actions: [
      {
        href: '/articles',
        label: '进入写作',
      },
      {
        href: '/projects',
        label: '查看项目',
      },
      {
        href: '/about',
        label: '了解这个平台',
      },
    ],
    emptyArticle: {
      body: '内容模型已经准备好；第一批通过 CMS 发布的中文长文会出现在这里。',
      eyebrow: '写作',
      title: '还没有公开文章。',
    },
    emptyProject: {
      body: '通过 Payload 发布的作品记录会在这里成为可检查的案例面板。',
      eyebrow: '项目',
      title: '还没有公开项目。',
    },
    hero: {
      eyebrow: '中文优先的技术图谱 / Public Workshop',
      summary:
        'Myshkin 451 是一个长期生长的个人数字平台：这里会放中文长文、公开项目、研究路径和小型实验，让思考与建造互相留下证据。',
      title: '把写作、项目和知识路径放回同一个工作台。',
    },
    statusLedgerAriaLabel: '平台入口状态',
    statusLine: {
      ariaLabel: '平台状态',
      barLabel: 'STATUS LINE',
      phase: 'Public Site / Ops Planning',
      items: {
        language: {
          label: '语言',
          value: '中文优先，保留英文路径',
        },
        nextSurface: {
          label: '下一个面',
          value: '知识路径与实验室预留入口',
        },
        projects: {
          label: '项目',
          valueSuffix: '个已发布',
        },
        writing: {
          label: '写作',
          valueSuffix: '篇已发布',
        },
      },
    },
    surfaceIndex: {
      ariaLabel: '平台四个入口',
      body: '首页先把平台结构说清楚：可阅读的文字、可检查的项目、将来可串联的知识路径，以及有边界的实验入口。',
      eyebrow: 'Surface Index',
      title: '四个入口，不是四个孤岛。',
    },
  },
  navigation: {
    primary: primaryNavigation,
  },
  platform: {
    surfaces: platformSurfaces,
  },
  siteChrome: {
    adminLabel: 'Admin',
    brandSubtitle: '技术图谱与公共工坊',
    languageLabel: '中文 / ZH',
    navAriaLabel: '主导航',
    sourceLabel: 'Source',
    statusAriaLabel: '站点状态',
  },
  siteFooter: {
    ariaLabel: '站点页脚',
    brandLine: 'Myshkin 451 / www.myshkin451.com',
    feed: {
      label: 'Feed',
      status: 'RSS 计划中',
    },
    language: {
      label: 'Language',
      status: '中文优先，英文路径保留',
    },
    source: {
      label: 'Public Source',
    },
    surfacesLabel: 'Surfaces',
    systemStatus: {
      label: 'System',
      status: 'Public site baseline ready',
    },
  },
  theme: {
    ariaLabel: '主题切换',
    options: themeOptions,
  },
} as const
