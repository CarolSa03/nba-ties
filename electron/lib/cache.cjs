// Small JSON cache kept in memory and saved to the app's user-data folder.
const { app } = require('electron')
const fs = require('fs')
const path = require('path')

const MAX_ENTRIES = 40
let mem = null
let timer = null

const file = () => path.join(app.getPath('userData'), 'cache.json')

function load() {
  if (mem) return mem
  try { mem = JSON.parse(fs.readFileSync(file(), 'utf8')) } catch { mem = {} }
  return mem
}

function flush() {
  if (!mem) return
  clearTimeout(timer)
  timer = null
  try {
    fs.mkdirSync(path.dirname(file()), { recursive: true })
    const tmp = file() + '.tmp'
    fs.writeFileSync(tmp, JSON.stringify(mem))
    fs.renameSync(tmp, file()) // atomic, so a crash never leaves a half-written cache
  } catch (e) {
    console.warn('Could not save cache:', e.message)
  }
}

function scheduleSave() {
  if (!timer) timer = setTimeout(flush, 400)
}

function get(key) {
  const entry = load()[key]
  if (entry) entry.lastUsed = Date.now()
  return entry
}

function set(key, entry) {
  const data = load()
  data[key] = { ...entry, lastUsed: Date.now() }
  const keys = Object.keys(data)
  if (keys.length > MAX_ENTRIES) {
    keys
      .filter((k) => k !== 'teams')
      .sort((a, b) => data[a].lastUsed - data[b].lastUsed)
      .slice(0, keys.length - MAX_ENTRIES)
      .forEach((k) => delete data[k])
  }
  scheduleSave()
}

function clear() {
  mem = {}
  flush()
}

module.exports = { get, set, clear, flush }
