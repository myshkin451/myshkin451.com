const formatter = new Intl.DateTimeFormat('zh-CN', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string): string {
  return formatter.format(new Date(value))
}
