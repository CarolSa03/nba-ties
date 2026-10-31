// The renderer is untrusted input: check everything before it reaches the API client.
const VIEWS = ['quarters', 'regulation', 'halftime', 'q1', 'q3']
const DATE = /^\d{4}-\d{2}-\d{2}$/

function validateFilters(f = {}) {
  const out = {
    view: VIEWS.includes(f.view) ? f.view : 'quarters',
    tiedOnly: !!f.tiedOnly,
    refresh: !!f.refresh,
    teamIds: Array.isArray(f.teamIds) ? f.teamIds.map(Number).filter(Number.isInteger).slice(0, 2) : []
  }
  if (f.season !== '' && f.season != null) {
    const n = Number(f.season)
    if (!Number.isInteger(n) || n < 1946 || n > 2100) throw new Error('That season is not valid.')
    out.season = n
  }
  for (const k of ['startDate', 'endDate']) {
    if (!f[k]) continue
    if (!DATE.test(f[k]) || Number.isNaN(Date.parse(f[k]))) throw new Error('That date is not valid.')
    out[k] = f[k]
  }
  if (out.startDate && out.endDate && out.startDate > out.endDate) {
    throw new Error('The start date must be before the end date.')
  }
  return out
}

module.exports = { validateFilters }
