import { describe, it, expect } from 'vitest'
import { filterGamesByTeams, filterTiedGames, sortGamesByDate } from './gameFilters'

const g = (home, visitor, date = '2025-01-01', has_ot = false) => ({ home_team: home, visitor_team: visitor, date, has_ot })
const games = [
  g('Boston Celtics', 'Miami Heat', '2025-01-01'),
  g('Miami Heat', 'Boston Celtics', '2025-01-03', true),
  g('Boston Celtics', 'Denver Nuggets', '2025-01-02'),
  g('Denver Nuggets', 'Miami Heat', '2025-01-04')
]

describe('filterGamesByTeams', () => {
  it('returns everything when no team is chosen', () => {
    expect(filterGamesByTeams(games, '', '')).toHaveLength(4)
  })
  it('returns all games of a single team, home or away', () => {
    expect(filterGamesByTeams(games, 'Denver Nuggets', '')).toHaveLength(2)
    expect(filterGamesByTeams(games, '', 'Denver Nuggets')).toHaveLength(2)
  })
  it('returns only head-to-head games for two teams, in either order', () => {
    expect(filterGamesByTeams(games, 'Boston Celtics', 'Miami Heat')).toHaveLength(2)
    expect(filterGamesByTeams(games, 'Miami Heat', 'Boston Celtics')).toHaveLength(2)
  })
  it('returns nothing for teams that never met', () => {
    expect(filterGamesByTeams([games[2]], 'Boston Celtics', 'Miami Heat')).toHaveLength(0)
  })
})

describe('sortGamesByDate', () => {
  it('sorts newest first by default', () => {
    expect(sortGamesByDate(games).map((x) => x.date)).toEqual(['2025-01-04', '2025-01-03', '2025-01-02', '2025-01-01'])
  })
  it('sorts oldest first when asked', () => {
    expect(sortGamesByDate(games, false)[0].date).toBe('2025-01-01')
  })
  it('does not change the original array', () => {
    const copy = [...games]
    sortGamesByDate(games)
    expect(games).toEqual(copy)
  })
})

describe('filterTiedGames', () => {
  it('keeps only overtime games', () => {
    expect(filterTiedGames(games)).toHaveLength(1)
  })
})