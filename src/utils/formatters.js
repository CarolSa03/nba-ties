export function formatDate(dateStr) {
  const safe = /^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr
  return new Date(safe).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function extractPeriodScore(periodStr) {
  if (!periodStr) return '0-0'
  const match = periodStr.match(/\((\d+-\d+)\)/) || periodStr.match(/^(\d+-\d+)/)
  return match ? match[1] : '0-0'
}

export function timeAgo(ts) {
  const mins = Math.round((Date.now() - ts) / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min ago`
  const hrs = Math.round(mins / 60)
  if (hrs < 24) return `${hrs} h ago`
  return `${Math.round(hrs / 24)} days ago`
}
