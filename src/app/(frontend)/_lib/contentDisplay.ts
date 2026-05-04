import type { Article, Project } from '@/payload-types'

type ContentNode = {
  children?: ContentNode[]
  text?: unknown
}

const projectStatusLabels: Record<NonNullable<Project['projectStatus']>, string> = {
  active: '进行中',
  archived: '已归档',
  maintained: '维护中',
  paused: '暂停',
}

export function formatProjectStatus(status: Project['projectStatus']): string {
  return status ? projectStatusLabels[status] : '状态未定'
}

export function getPublicationYear(publishedAt?: null | string): string {
  if (!publishedAt) {
    return '未定'
  }

  const date = new Date(publishedAt)

  if (Number.isNaN(date.getTime())) {
    return '未定'
  }

  return String(date.getFullYear())
}

export function groupByPublicationYear<T extends { publishedAt?: null | string }>(
  items: T[],
): Array<{ items: T[]; year: string }> {
  const groups = new Map<string, T[]>()

  for (const item of items) {
    const year = getPublicationYear(item.publishedAt)
    const group = groups.get(year) ?? []

    group.push(item)
    groups.set(year, group)
  }

  return Array.from(groups, ([year, groupedItems]) => ({
    items: groupedItems,
    year,
  }))
}

export function getReadingMinutes(
  content: Article['content'] | Project['content'] | null | undefined,
  fallbackText = '',
): number {
  const text = `${fallbackText} ${collectText(content)}`.trim()

  if (!text) {
    return 1
  }

  const cjkCharacters = text.match(/[\u3400-\u9fff]/g)?.length ?? 0
  const latinWords = text
    .replace(/[\u3400-\u9fff]/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length
  const readingUnits = cjkCharacters + latinWords * 2

  return Math.max(1, Math.ceil(readingUnits / 500))
}

export function getProjectTechnologyNames(project: Project): string[] {
  return (
    project.technologies
      ?.map((technology) => technology.name)
      .filter((name): name is string => Boolean(name)) ?? []
  )
}

function collectText(value: unknown): string {
  if (!value || typeof value !== 'object') {
    return ''
  }

  const node = value as ContentNode
  const ownText = typeof node.text === 'string' ? node.text : ''
  const childText = node.children?.map(collectText).join(' ') ?? ''

  return `${ownText} ${childText}`.trim()
}
