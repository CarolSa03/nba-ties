// BallDontLie client with a disk cache:
//  - finished games never change, so past date ranges are kept for good
//  - ranges that include recent days are refreshed incrementally (only the newest days are re-fetched)
//  - an interrupted download resumes where it stopped (helps with rate limits)
//  - if the API fails, saved results are shown instead of an error
const { getApiKey } = require('./settings.cjs')
const { processGame, filterByView, filterTiedOnly } = require('./gameProcessor.cjs')
const cache = require('./cache.cjs')

const BASE_URL = 'https://api.balldontlie.io/v1'
const RECENT_TTL = 10 * 60 * 1000
const TEAMS_TTL = 30 * 24 * 60 * 60 * 1000
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
let lastRequest = 0

const isoDaysAgo = (n) => {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
}

async function request(pathname, params = {}) {
  const key = getApiKey()
  if (!key) throw new Error('No API key set. Add your BallDontLie key in settings.')

  const url = new URL(BASE_URL + pathname)
  for (const [k, v] of Object.entries(params)) {
    if (Array.isArray(v)) v.forEach((x) => url.searchParams.append(k, x))
    else if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, v)
  }

  for (let attempt = 0; attempt < 5; attempt++) {
    const wait = 500 - (Date.now() - lastRequest)
    if (wait > 0) await sleep(wait)
    lastRequest = Date.now()

    let res
    try {
      res = await fetch(url, { headers: { Authorization: key } })
    } catch {
      throw new Error('Could not reach BallDontLie. Check your internet connection.')
    }
    if (res.status === 429) {
      await sleep((Number(res.headers.get('retry-after')) || 12) * 1000)
      continue
    }
    if (res.status === 401) throw new Error('The API key was rejected (401). Check it in settings.')
    if (!res.ok) throw new Error(`BallDontLie returned ${res.status}`)
    return res.json()
  }
  throw new Error('Rate limited by BallDontLie.')
}

// ---------- teams ----------
async function getTeams() {
  const saved = cache.get('teams')
  if (saved && Date.now() - saved.fetchedAt < TEAMS_TTL) return saved.data
  try {
    const data = await request('/teams')
    cache.set('teams', { fetchedAt: Date.now(), data })
    return data
  } catch (e) {
    if (saved) return saved.data
    throw e
  }
}

// ---------- games ----------
// Keep only what processGame needs, so the cache stays small.
function slim(g) {
  const o = {
    id: g.id, date: g.date, status: g.status,
    home_team: { full_name: g.home_team.full_name },
    visitor_team: { full_name: g.visitor_team.full_name },
    home_team_score: g.home_team_score, visitor_team_score: g.visitor_team_score
  }
  for (let i = 1; i <= 4; i++) {
    o[`home_q${i}`] = g[`home_q${i}`]; o[`visitor_q${i}`] = g[`visitor_q${i}`]
    o[`home_ot${i}`] = g[`home_ot${i}`]; o[`visitor_ot${i}`] = g[`visitor_ot${i}`]
  }
  return o
}

async function pull(params, cursor, onPage) {
  for (let page = 1; page <= 40; page++) {
    const data = await request('/games', { ...params, cursor })
    cursor = data.meta && data.meta.next_cursor
    onPage((data.data || []).map(slim), cursor, page)
    if (!cursor) return true
  }
  return false
}

function build(entry, filters, flags) {
  const { season, startDate, endDate, tiedOnly, view } = filters
  let results = entry.games.map(processGame).filter(Boolean)
  results = filterByView(results, view)
  if (tiedOnly) results = filterTiedOnly(results)
  return {
    success: true, season, start_date: startDate, end_date: endDate, tied_only: !!tiedOnly,
    api_games: entry.games.length, results: results.length, games: results,
    cached: false, stale: false, fetchedAt: entry.fetchedAt, warning: '', ...flags
  }
}

async function getGames(filters, onProgress = () => {}) {
  const { season, startDate, endDate, teamIds, refresh } = filters
  const end = endDate || isoDaysAgo(0)
  const volatile = end >= isoDaysAgo(1) // includes games that may still be changing

  const params = { per_page: 100, end_date: end }
  if (season) params['seasons[]'] = season
  if (startDate) params.start_date = startDate
  if (teamIds && teamIds.length) params['team_ids[]'] = teamIds

  // The key ignores view and "ties only", so switching them never needs the API.
  const key = 'games:' + JSON.stringify({
    s: season || '', a: startDate || '', e: endDate || 'open', t: (teamIds || []).map(String).sort()
  })
  const saved = cache.get(key)

  if (saved && saved.complete && !refresh && (!volatile || Date.now() - saved.fetchedAt < RECENT_TTL)) {
    return build(saved, filters, { cached: true })
  }

  try {
    if (saved && saved.complete) {
      // Incremental update: only ask for the last few days, then merge by game id.
      const latest = saved.games.reduce((m, g) => (g.date.slice(0, 10) > m ? g.date.slice(0, 10) : m), '')
      const d = new Date(latest + 'T00:00:00')
      d.setDate(d.getDate() - 3)
      const since = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10)
      const byId = new Map(saved.games.map((g) => [g.id, g]))
      await pull({ ...params, start_date: since > (startDate || '') ? since : startDate }, undefined, (batch, _c, page) => {
        batch.forEach((g) => byId.set(g.id, g))
        onProgress({ page, fetched: byId.size })
      })
      const updated = { ...saved, games: [...byId.values()], fetchedAt: Date.now() }
      cache.set(key, updated)
      return build(updated, filters, { cached: false })
    }

    // First download, or resuming one that was interrupted.
    const entry = saved && !saved.complete ? saved : { games: [], cursor: undefined, complete: false }
    const done = await pull(params, entry.cursor, (batch, cursor, page) => {
      entry.games = entry.games.concat(batch)
      entry.cursor = cursor
      entry.fetchedAt = Date.now()
      cache.set(key, entry) // saved after every page so progress is never lost
      onProgress({ page, fetched: entry.games.length })
    })
    entry.complete = done
    if (done) entry.cursor = undefined
    entry.fetchedAt = Date.now()
    cache.set(key, entry)
    return build(entry, filters, { cached: false })
  } catch (e) {
    if (saved && saved.complete) {
      return build(saved, filters, { cached: true, stale: true, warning: e.message })
    }
    const partial = cache.get(key)
    if (partial && partial.games.length) {
      throw new Error(`${e.message} ${partial.games.length} games were saved, so tap Find games again to continue.`)
    }
    throw e
  }
}

module.exports = { getGames, getTeams }
