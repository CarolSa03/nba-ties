import { reactive } from 'vue'

const iso = (d) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
const daysAgo = (n) => { const d = new Date(); d.setDate(d.getDate() - n); return iso(d) }
const currentSeason = () => {
  const now = new Date()
  return now.getMonth() >= 9 ? now.getFullYear() : now.getFullYear() - 1 // seasons start in October
}

export function useGameFilters(getTeamId = () => undefined) {
  const filters = reactive({
    preset: 'month',
    season: '',
    startDate: '',
    endDate: iso(new Date()),
    teamA: '',
    teamB: '',
    viewType: 'quarters',
    tiedOnly: true,
    sortDescending: true
  })

  const resetTeams = () => { filters.teamA = ''; filters.teamB = '' }

  function getFilters() {
    const base = {
      tiedOnly: filters.tiedOnly,
      view: filters.viewType,
      teamIds: [filters.teamA, filters.teamB].filter(Boolean).map(getTeamId).filter(Boolean)
    }
    switch (filters.preset) {
      case 'week': return { ...base, startDate: daysAgo(7) }
      case 'month': return { ...base, startDate: daysAgo(30) }
      case 'season': return { ...base, season: currentSeason() }
      default: return { ...base, season: filters.season, startDate: filters.startDate, endDate: filters.endDate }
    }
  }

  return { filters, resetTeams, getFilters }
}
