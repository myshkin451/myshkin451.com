const formatter = new Intl.DateTimeFormat('en', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
})

export function formatDate(value: string): string {
  return formatter.format(new Date(value))
}
