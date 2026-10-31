const test = require('node:test')
const assert = require('node:assert')
const Module = require('module')
const os = require('os')
const fs = require('fs')
const path = require('path')

let dir
const originalLoad = Module._load
Module._load = function (request, ...rest) {
  return request === 'electron' ? { app: { getPath: () => dir } } : originalLoad.call(this, request, ...rest)
}

const libs = ['client', 'cache', 'settings'].map((n) => require.resolve(`../electron/lib/${n}.cjs`))
function setup() {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nba-client-'))
  process.env.BALLDONTLIE_API_KEY = 'test-key'
  libs.forEach((l) => delete require.cache[l])
  return { client: require(libs[0]), calls: [] }
}

const game = (id, date, o = {}) => ({
  id, date, status: 'Final',
  home_team: { full_name: 'Home' }, visitor_team: { full_name: 'Away' },
  home_team_score: 100, visitor_team_score: 100,
  home_q1: 25, visitor_q1: 25, home_q2: 25, visitor_q2: 25,
  home_q3: 25, visitor_q3: 25, home_q4: 25, visitor_q4: 25, ...o
})
const reply = (body, status = 200, headers = {}) => ({
  ok: status >= 200 && status < 300, status,
  headers: { get: (h) => headers[h.toLowerCase()] ?? null },
  json: async () => body
})
const serve = (calls, handler) => {
  global.fetch = async (url, opts) => {
    const u = new URL(url)
    calls.push({ url: u, headers: opts.headers })
    return handler(u, calls.length)
  }
}
const FILTERS = { startDate: '2025-01-01', endDate: '2025-01-31', tiedOnly: false, view: 'quarters' }
const twoPages = (u) =>
  u.searchParams.get('cursor') === 'c2'
    ? reply({ data: [game(3, '2025-01-25')], meta: {} })
    : reply({ data: [game(1, '2025-01-10'), game(2, '2025-01-20')], meta: { next_cursor: 'c2' } })

test('follows the cursor through every page and sends the key', async () => {
  const { client, calls } = setup()
  serve(calls, twoPages)
  const res = await client.getGames(FILTERS)
  assert.strictEqual(res.api_games, 3)
  assert.strictEqual(calls.length, 2)
  assert.strictEqual(calls[0].headers.Authorization, 'test-key')
  assert.strictEqual(calls[1].url.searchParams.get('cursor'), 'c2')
})

test('sends each team id as team_ids[]', async () => {
  const { client, calls } = setup()
  serve(calls, () => reply({ data: [], meta: {} }))
  await client.getGames({ ...FILTERS, teamIds: [3, 5] })
  assert.deepStrictEqual(calls[0].url.searchParams.getAll('team_ids[]'), ['3', '5'])
})

test('the same search a second time never touches the API', async () => {
  const { client, calls } = setup()
  serve(calls, twoPages)
  await client.getGames(FILTERS)
  const before = calls.length
  const res = await client.getGames(FILTERS)
  assert.strictEqual(calls.length, before)
  assert.strictEqual(res.cached, true)
})

test('changing the view or ties only reuses the saved games', async () => {
  const { client, calls } = setup()
  serve(calls, twoPages)
  await client.getGames(FILTERS)
  const before = calls.length
  const res = await client.getGames({ ...FILTERS, view: 'halftime', tiedOnly: true })
  assert.strictEqual(calls.length, before)
  assert.strictEqual(res.cached, true)
})

test('refresh only asks for the newest days and merges by game id', async () => {
  const { client, calls } = setup()
  serve(calls, twoPages)
  await client.getGames(FILTERS)
  calls.length = 0
  serve(calls, () => reply({
    data: [game(3, '2025-01-25', { home_team_score: 99 }), game(4, '2025-01-27')], meta: {}
  }))
  const res = await client.getGames({ ...FILTERS, refresh: true })
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(calls[0].url.searchParams.get('start_date'), '2025-01-22')
  assert.strictEqual(res.api_games, 4)
})

test('an interrupted download keeps its progress and resumes from the cursor', async () => {
  const { client, calls } = setup()
  serve(calls, (u, n) => (n === 2 ? reply({}, 500) : twoPages(u)))
  await assert.rejects(client.getGames(FILTERS), /2 games were saved/)
  calls.length = 0
  serve(calls, twoPages)
  const res = await client.getGames(FILTERS)
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(calls[0].url.searchParams.get('cursor'), 'c2')
  assert.strictEqual(res.api_games, 3)
})

test('shows saved results with a warning when an update fails', async () => {
  const { client, calls } = setup()
  serve(calls, twoPages)
  await client.getGames(FILTERS)
  serve(calls, () => reply({}, 500))
  const res = await client.getGames({ ...FILTERS, refresh: true })
  assert.strictEqual(res.stale, true)
  assert.match(res.warning, /500/)
  assert.strictEqual(res.api_games, 3)
})

test('explains a network failure', async () => {
  const { client } = setup()
  global.fetch = async () => { throw new TypeError('fetch failed') }
  await assert.rejects(client.getGames(FILTERS), /Could not reach BallDontLie/)
})

test('explains a rejected key', async () => {
  const { client, calls } = setup()
  serve(calls, () => reply({}, 401))
  await assert.rejects(client.getGames(FILTERS), /rejected/)
})

test('asks for a key when none is set', async () => {
  const { client } = setup()
  delete process.env.BALLDONTLIE_API_KEY
  await assert.rejects(client.getGames(FILTERS), /No API key/)
})

test('waits and retries after a 429', async () => {
  const { client, calls } = setup()
  serve(calls, (u, n) => (n === 1 ? reply({}, 429, { 'retry-after': '1' }) : reply({ data: [], meta: {} })))
  const res = await client.getGames(FILTERS)
  assert.strictEqual(calls.length, 2)
  assert.strictEqual(res.api_games, 0)
})

test('the teams list is fetched once and then saved', async () => {
  const { client, calls } = setup()
  serve(calls, () => reply({ data: [{ id: 1, full_name: 'Atlanta Hawks' }] }))
  await client.getTeams()
  const second = await client.getTeams()
  assert.strictEqual(calls.length, 1)
  assert.strictEqual(second.data[0].full_name, 'Atlanta Hawks')
})