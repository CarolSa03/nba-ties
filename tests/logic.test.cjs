const test = require('node:test')
const assert = require('node:assert')
const { processGame, filterByView, filterTiedOnly } = require('../electron/lib/gameProcessor.cjs')
const { validateFilters } = require('../electron/lib/validate.cjs')

const game = (o = {}) => ({
  id: 1, status: 'Final', date: '2025-01-02T00:00:00Z',
  home_team: { full_name: 'Home' }, visitor_team: { full_name: 'Away' },
  home_team_score: 110, visitor_team_score: 108,
  home_q1: 25, visitor_q1: 25, home_q2: 30, visitor_q2: 28,
  home_q3: 25, visitor_q3: 27, home_q4: 20, visitor_q4: 20, ...o
})

test('ignores games that are not final', () => {
  assert.strictEqual(processGame(game({ status: '3rd Qtr' })), null)
})

test('finds quarters that were tied on the running score', () => {
  assert.deepStrictEqual(processGame(game()).valid_ties, ['Q1 (25)', 'Q3 (80)', 'Q4 (100)'])
})

test('games without quarter data are not reported as tied', () => {
  const g = processGame(game({ home_q1: 0, visitor_q1: 0, home_q2: 0, visitor_q2: 0, home_q3: 0, visitor_q3: 0, home_q4: 0, visitor_q4: 0 }))
  assert.strictEqual(filterTiedOnly([g]).length, 0)
})

test('halftime view keeps one period and ties only means tied at the half', () => {
  const g = processGame(game())
  const [half] = filterByView([g], 'halftime')
  assert.deepStrictEqual(Object.keys(half.periods), ['Q2'])
  assert.strictEqual(filterTiedOnly([half]).length, 0)
})

test('regulation view keeps only overtime games and drops OT periods', () => {
  const ot = processGame(game({ home_ot1: 10, visitor_ot1: 8 }))
  const out = filterByView([ot, processGame(game({ id: 2 }))], 'regulation')
  assert.strictEqual(out.length, 1)
  assert.deepStrictEqual(Object.keys(out[0].periods), ['Q1', 'Q2', 'Q3', 'Q4'])
})

test('validateFilters cleans and rejects input', () => {
  assert.deepStrictEqual(validateFilters({ view: 'nope', teamIds: ['3', 'x', 5, 7] }).teamIds, [3, 5])
  assert.strictEqual(validateFilters({ view: 'nope' }).view, 'quarters')
  assert.throws(() => validateFilters({ season: 'abc' }))
  assert.throws(() => validateFilters({ startDate: '2025-02-01', endDate: '2025-01-01' }))
  assert.throws(() => validateFilters({ startDate: 'tomorrow' }))
})
