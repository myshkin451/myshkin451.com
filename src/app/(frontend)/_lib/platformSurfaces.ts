export type PlatformSurface = {
  description: string
  english: string
  href?: string
  id: 'writing' | 'projects' | 'knowledge' | 'labs'
  label: string
  marker: string
  signal: string
  status: string
}

export const primaryNav = [
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
    english: 'About',
    href: '/about',
    label: '关于',
  },
]

export const platformSurfaces: PlatformSurface[] = [
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
    id: 'knowledge',
    label: '知识路径',
    marker: '03',
    signal: 'Maps / Study',
    status: '预留',
  },
  {
    description: '小工具、AI demo 和更有弹性的试验场，但不挤压核心内容模型。',
    english: 'Labs',
    id: 'labs',
    label: '实验室',
    marker: '04',
    signal: 'Tools / Experiments',
    status: '预留',
  },
]
