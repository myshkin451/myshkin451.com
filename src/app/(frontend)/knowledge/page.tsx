import { ReservedSurfacePage } from '../_components/ReservedSurfacePage'
import { createPageMetadata } from '@/lib/siteMetadata'

export const metadata = createPageMetadata({
  pathname: '/knowledge',
  description: 'Myshkin 451 的知识路径预留入口：未来会连接学习、研究、公共札记和主题地图。',
  title: '知识路径',
})

const facts = [
  {
    label: '状态',
    value: '预留入口已开放',
  },
  {
    label: '第一种形态',
    value: '主题路径页，而不是完整图谱',
  },
  {
    label: '内容来源',
    value: '学习札记、研究线索、长文与项目复盘',
  },
] as const

const steps = [
  {
    body: '先把少数真实主题整理成可阅读的路径，而不是为了结构感提前制造复杂分类。',
    marker: '01',
    title: '从真实主题开始',
  },
  {
    body: '每条路径需要能连接文章、项目、书目或工作笔记，让读者知道下一步该读什么。',
    marker: '02',
    title: '连接已有表面',
  },
  {
    body: '等内容密度足够后，再考虑标签、关系图、搜索和更强的知识检索界面。',
    marker: '03',
    title: '推迟复杂图谱',
  },
] as const

export default function KnowledgePage() {
  return (
    <ReservedSurfacePage
      board={{
        body: '知识路径会更像研究路线和阅读地图：有入口、有顺序、有交叉引用，但不会在内容还少时伪装成完整知识库。',
        eyebrow: 'Path Design',
        title: '先做可读路径，再做复杂结构。',
      }}
      facts={facts}
      hero={{
        eyebrow: '知识路径 / Knowledge Paths',
        summary:
          '这里将来会收纳围绕哲学、技术、AI 工具和长期研究主题的路径入口。当前先把边界公开：它不是全文搜索，也不是私人笔记搬家，而是让重要主题有一条可以被别人进入的路线。',
        title: '把分散的学习和研究整理成可进入的路线。',
      }}
      links={[
        {
          href: '/articles',
          label: '先看公开写作',
        },
        {
          href: '/projects',
          label: '查看相关项目',
        },
      ]}
      note={{
        body: '这一页暂时不创建新的 CMS collection。下一步只有在真实文章、项目和笔记能支撑路径时，才需要设计知识路径的数据模型。',
        eyebrow: 'Boundary',
        title: '它是公开边界，不是提前造出的知识系统。',
      }}
      statusAriaLabel="知识路径状态"
      steps={steps}
      surfaceId="knowledge"
      theme="light"
    />
  )
}
