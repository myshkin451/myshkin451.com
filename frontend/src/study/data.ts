import { sampleEntries } from '../seed'
import type { Entry } from '../types'

// Labeled fixtures only; never mounted through a persistence adapter.
export const studyEntries: Entry[] = sampleEntries.filter(
  (entry) => !['color-study', 'this-site'].includes(entry.id),
)

export function entryPath(entry: Entry) {
  return `/entry/${encodeURIComponent(entry.id)}`
}

export function shortDate(date: string) {
  return new Intl.DateTimeFormat('zh-CN', { month: 'long', day: 'numeric' }).format(new Date(date))
}
