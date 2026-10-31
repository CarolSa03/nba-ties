import { describe, it, expect, vi, afterEach } from 'vitest'
import { useGameFilters } from './useGameFilters'

const TEAMS = { 'Boston Celtics': 2, 'Miami Heat': 16 }
const at = (iso) => { vi.useFakeTimers(); vi.setSystemTime(new Date(iso)) }
afterEach(() => vi.useRealTimers())

describe('useGameFilters', () => {
  it('starts with sensible defaults', () => {
    const { filters } = useGameFilters()
    expect(filters).toMatchObject({ preset: 'month', tiedOnly: true, sortDescending: true, viewType: 'quarters' })
  })

  it('builds the last 7 and 30 day ranges', () => {
    at('2025-03-15T12:00:00')
    const { filters, getFilters } = useGameFilters()
    filters.preset = 'week'
    expect(getFilters().startDate).toBe('2025-03-08')
    filters.preset = 'month'
    expect(getFilters().startDate).toBe('2025-02-13')
  })

  it('picks the right season on either side of October', () => {
    const { filters, getFilters } = useGameFilters()
    filters.preset = 'season'
    at('2025-09-30T12:00:00')
    expect(getFilters().season).toBe(2024)
    at('2025-10-15T12:00:00')
    expect(getFilters().season).toBe(2025)
  })

  it('passes custom values through', () => {
    const { filters, getFilters } = useGameFilters()
    Object.assign(filters, { preset: 'custom', season: 2023, startDate: '2024-01-01', endDate: '2024-02-01' })
    expect(getFilters()).toMatchObject({ season: 2023, startDate: '2024-01-01', endDate: '2024-02-01' })
  })

  it('turns chosen team names into ids and drops unknown ones', () => {
    const { filters, getFilters } = useGameFilters((name) => TEAMS[name])
    filters.teamA = 'Boston Celtics'
    filters.teamB = 'Nobody FC'
    expect(getFilters().teamIds).toEqual([2])
    filters.teamB = 'Miami Heat'
    expect(getFilters().teamIds).toEqual([2, 16])
  })

  it('sends the view and ties only switch', () => {
    const { filters, getFilters } = useGameFilters()
    filters.viewType = 'halftime'
    filters.tiedOnly = false
    expect(getFilters()).toMatchObject({ view: 'halftime', tiedOnly: false })
  })

  it('clears both teams', () => {
    const { filters, resetTeams } = useGameFilters()
    filters.teamA = 'Boston Celtics'
    filters.teamB = 'Miami Heat'
    resetTeams()
    expect([filters.teamA, filters.teamB]).toEqual(['', ''])
  })
})