import { ReservedSurfacePage } from '../_components/ReservedSurfacePage'
import { createPageMetadata } from '@/lib/siteMetadata'

export const metadata = createPageMetadata({
  pathname: '/labs',
  description: 'Myshkin 451 的实验室预留入口：未来会承载小工具、AI demos 和可边界化的交互实验。',
  title: '实验室',
})

const facts = [
  {
    label: '状态',
    value: '预留入口已开放',
  },
  {
    label: '实验类型',
    value: '工具、AI demos、交互原型',
  },
  {
    label: '约束',
    value: '继承平台导航，不污染核心内容模型',
  },
] as const

const steps = [
  {
    body: '每个实验都应该有清楚标题、当前状态、交互区域和简短说明，避免只剩一段炫技展示。',
    marker: '01',
    title: '保留可检查状态',
  },
  {
    body: '实验可以更有弹性，但入口、返回路径和主题切换要继续继承公共平台的基本规则。',
    marker: '02',
    title: '不脱离平台结构',
  },
  {
    body: '只有当某个实验反复被使用，才把它提升成稳定工具、项目记录或新的内容模型。',
    marker: '03',
    title: '从实验走向作品',
  },
] as const

export default function LabsPage() {
  return (
    <ReservedSurfacePage
      board={{
        body: '实验室允许更快、更松的尝试，但仍要给访问者明确的边界：什么能用，什么还只是原型，什么值得继续发展。',
        eyebrow: 'Lab Protocol',
        title: '实验可以更大胆，但不能失去回路。',
      }}
      facts={facts}
      hero={{
        eyebrow: '实验室 / Labs',
        summary:
          '这里会放小工具、AI demo、交互原型和一些暂时不适合塞进文章或项目页的尝试。它可以比核心页面更活一点，但仍然要能回到 Myshkin 451 的公共结构里。',
        title: '给工具、AI demo 和小型试验留一个有边界的场地。',
      }}
      links={[
        {
          href: '/projects',
          label: '查看项目卷宗',
        },
        {
          href: '/about',
          label: '了解平台边界',
        },
      ]}
      note={{
        body: '这一页暂时不承诺任何实验已经可用。它先作为未来入口和设计约束存在，等第一个真实 lab 出现时再补交互区域和测试。',
        eyebrow: 'Boundary',
        title: '实验室是弹性区域，不是另一个未完成产品。',
      }}
      statusAriaLabel="实验室状态"
      steps={steps}
      surfaceId="labs"
      theme="dark"
    />
  )
}
