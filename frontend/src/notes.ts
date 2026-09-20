import type { Entry } from './types'

// One editorial calendar for every reader, including the server render.
export function noteDate(value: string) {
  const date = new Date(value)
  const valid = !Number.isNaN(date.valueOf())
  const parts = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Asia/Shanghai',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(valid ? date : new Date(0))
  const get = (type: string) => parts.find((part) => part.type === type)?.value || ''
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    time: get('hour') + ':' + get('minute'),
    key: get('year') + '-' + get('month'),
  }
}

export function publicNotes(entries: Entry[]) {
  return entries
    .filter((entry) => entry.kind === 'note' && entry.status === 'published')
    .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt) || b.id.localeCompare(a.id))
}

export function noteExcerpt(body: string, length = 240) {
  const text = [...body.trim()]
  return text.slice(0, length).join('') + (text.length > length ? '…' : '')
}
