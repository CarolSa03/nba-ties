const test = require('node:test')
const assert = require('node:assert')
const { processGame, filterByView, filterTiedOnly } = require('../electron/lib/gameProcessor.cjs')

const game = (o = {}) => ({
  id: 1, status: 'Final', date: '2025-01-02T00:00:00Z',
  home_team: { full_name: 'Home' }, visitor_team: { full_name: 'Away' },
  home_team_score: 100, visitor_team_score: 100,
  home_q1: 25, visitor_q1: 25, home_q2: 25, visitor_q2: 25,
  home_q3: 25, visitor_q3: 25, home_q4: 25, visitor_q4: 25, ...o
})

test('formats quarter and overtime periods differently', () => {
  const g = processGame(game({ home_ot1: 10, visitor_ot1: 8 }))
  assert.strictEqual(g.periods.Q1, '25-25 (25-25)')
  assert.strictEqual(g.periods.OT1, '8-10 (108-110)')
})

test('handles several overtimes and marks each tie', () => {
  const g = processGame(game({ home_ot1: 10, visitor_ot1: 10, home_ot2: 5, visitor_ot2: 3 }))
  assert.deepStrictEqual(Object.keys(g.periods), ['Q1', 'Q2', 'Q3', 'Q4', 'OT1', 'OT2'])
  assert.ok(g.valid_ties.includes('OT1 (110)'))
  assert.ok(!g.valid_ties.some((t) => t.startsWith('OT2')))
})

test('stops reading overtimes at the first empty one', () => {
  const g = processGame(game({ home_ot1: 5, visitor_ot1: 3, home_ot2: 0, visitor_ot2: 0, home_ot3: 4, visitor_ot3: 2 }))
  assert.deepStrictEqual(Object.keys(g.periods).filter((k) => k.startsWith('OT')), ['OT1'])
})

test('has_ot is false when overtime fields are null or zero', () => {
  assert.strictEqual(processGame(game({ home_ot1: null, visitor_ot1: 0 })).has_ot, false)
})

test('final score falls back to the period totals when missing', () => {
  const g = processGame(game({ home_team_score: null, visitor_team_score: null, home_q4: 30 }))
  assert.strictEqual(g.final_score, '100-105')
})

test('regulation_score ignores overtime', () => {
  const g = processGame(game({ home_ot1: 10, visitor_ot1: 8 }))
  assert.strictEqual(g.regulation_score, '100-100')
  assert.strictEqual(g.has_ot, true)
})

test('date is cut to YYYY-MM-DD and the id is kept', () => {
  const g = processGame(game({ id: 77, date: '2025-03-09T23:30:00.000Z' }))
  assert.strictEqual(g.date, '2025-03-09')
  assert.strictEqual(g.id, 77)
})

test('the full-game view returns games untouched', () => {
  const list = [processGame(game())]
  assert.deepStrictEqual(filterByView(list, 'quarters'), list)
})

test('q1 and q3 views keep only their own period', () => {
  const g = processGame(game())
  assert.deepStrictEqual(Object.keys(filterByView([g], 'q1')[0].periods), ['Q1'])
  assert.deepStrictEqual(Object.keys(filterByView([g], 'q3')[0].periods), ['Q3'])
})

test('regulation view hides ties that only happened in overtime', () => {
  const g = processGame(game({ home_q4: 20, home_ot1: 10, visitor_ot1: 15, home_ot2: 5, visitor_ot2: 0 }))
  const [reg] = filterByView([g], 'regulation')
  assert.ok(reg.valid_ties.every((t) => !t.startsWith('OT')))
})

test('ties only keeps games with at least one real tie', () => {
  const tied = processGame(game())
  const never = processGame(game({ id: 2, visitor_q1: 20, visitor_q2: 20, visitor_q3: 20, visitor_q4: 20 }))
  assert.deepStrictEqual(filterTiedOnly([tied, never]).map((g) => g.id), [1])
})