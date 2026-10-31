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
const modulePath = require.resolve('../electron/lib/cache.cjs')
const freshCache = () => {
  delete require.cache[modulePath]
  return require(modulePath)
}
test.beforeEach(() => { dir = fs.mkdtempSync(path.join(os.tmpdir(), 'nba-cache-')) })

test('stores and returns a value', () => {
  const cache = freshCache()
  cache.set('a', { value: 1 })
  assert.strictEqual(cache.get('a').value, 1)
})

test('returns undefined for unknown keys', () => {
  assert.strictEqual(freshCache().get('missing'), undefined)
})

test('survives an app restart', () => {
  const first = freshCache()
  first.set('a', { value: 42 })
  first.flush()
  assert.strictEqual(freshCache().get('a').value, 42)
})

test('clear removes everything, including from disk', () => {
  const cache = freshCache()
  cache.set('a', { value: 1 })
  cache.flush()
  cache.clear()
  assert.strictEqual(freshCache().get('a'), undefined)
})

test('a corrupt cache file is ignored instead of crashing', () => {
  fs.writeFileSync(path.join(dir, 'cache.json'), '{not json')
  assert.strictEqual(freshCache().get('a'), undefined)
})

test('saving leaves no temporary file behind', () => {
  const cache = freshCache()
  cache.set('a', { value: 1 })
  cache.flush()
  assert.deepStrictEqual(fs.readdirSync(dir), ['cache.json'])
})

test('keeps at most 40 entries but never evicts the teams list', () => {
  const cache = freshCache()
  cache.set('teams', { data: [] })
  for (let i = 0; i < 45; i++) cache.set(`k${i}`, { i })
  const kept = Array.from({ length: 45 }, (_, i) => cache.get(`k${i}`)).filter(Boolean)
  assert.strictEqual(kept.length, 39)
  assert.ok(cache.get('teams'))
})