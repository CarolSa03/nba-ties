// Port of game_processor.py
function hasOvertime(game) {
  const pos = (v) => v !== null && v !== undefined && v > 0
  for (let i = 1; i <= 4; i++) {
    if (pos(game[`home_ot${i}`]) || pos(game[`visitor_ot${i}`])) return true
  }
  return false
}

function processGame(game) {
  if (game.status !== 'Final') return null

  const hasOt = hasOvertime(game)
  const homeScores = [1, 2, 3, 4].map((i) => game[`home_q${i}`] || 0)
  const visitorScores = [1, 2, 3, 4].map((i) => game[`visitor_q${i}`] || 0)

  const tiedQuarters = []
  const validTies = []
  const periods = {}
  let homeCum = 0
  let visitorCum = 0

  for (let q = 0; q < 4; q++) {
    homeCum += homeScores[q]
    visitorCum += visitorScores[q]
    periods[`Q${q + 1}`] = `${visitorCum}-${homeCum} (${visitorScores[q]}-${homeScores[q]})`

    if (homeCum === visitorCum && homeCum > 0) validTies.push(`Q${q + 1} (${homeCum})`)
    if (homeCum === visitorCum) tiedQuarters.push(`Q${q + 1} (${homeCum})`)
  }

  const regulationScore = `${visitorCum}-${homeCum}`

  if (hasOt) {
    for (let ot = 1; ot <= 4; ot++) {
      const h = game[`home_ot${ot}`] || 0
      const v = game[`visitor_ot${ot}`] || 0
      if (h === 0 && v === 0) break
      homeCum += h
      visitorCum += v
      const label = `OT${ot}`
      periods[label] = `${v}-${h} (${visitorCum}-${homeCum})`
      if (homeCum === visitorCum) tiedQuarters.push(`${label} (${homeCum})`)
      if (homeCum === visitorCum && homeCum > 0) validTies.push(`${label} (${homeCum})`)
    }
  }

  const finalHome = game.home_team_score || homeCum
  const finalVisitor = game.visitor_team_score || visitorCum

  return {
    id: game.id,
    date: String(game.date).slice(0, 10),
    home_team: game.home_team.full_name,
    visitor_team: game.visitor_team.full_name,
    final_score: `${finalVisitor}-${finalHome}`,
    regulation_score: regulationScore,
    has_ot: hasOt,
    tied_quarters: tiedQuarters,
    valid_ties: validTies,
    periods
  }
}

const VIEW_PERIOD = { q1: 'Q1', halftime: 'Q2', q3: 'Q3' }
const isPeriod = (label, p) => label.split(' ')[0] === p

function filterByView(games, view) {
  if (view === 'regulation') {
    // Overtime games only, showing just the four regulation quarters
    return games
      .filter((g) => g.has_ot)
      .map((g) => ({
        ...g,
        periods: Object.fromEntries(Object.entries(g.periods).filter(([k]) => !k.startsWith('OT'))),
        tied_quarters: g.tied_quarters.filter((t) => !t.startsWith('OT')),
        valid_ties: g.valid_ties.filter((t) => !t.startsWith('OT'))
      }))
  }
  const only = VIEW_PERIOD[view]
  if (only) {
    // Single-period views: keep just that period so "ties only" means tied at that point
    return games.map((g) => ({
      ...g,
      periods: Object.fromEntries(Object.entries(g.periods).filter(([k]) => k === only)),
      tied_quarters: g.tied_quarters.filter((t) => isPeriod(t, only)),
      valid_ties: g.valid_ties.filter((t) => isPeriod(t, only))
    }))
  }
  return games
}

// valid_ties ignores 0-0, so games missing quarter data are not reported as tied
const filterTiedOnly = (games) => games.filter((g) => g.valid_ties.length > 0)

module.exports = { processGame, filterByView, filterTiedOnly }
