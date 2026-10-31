// Stores the API key encrypted (OS keychain via safeStorage) in the app's user-data folder.
const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')

const file = () => path.join(app.getPath('userData'), 'settings.json')

function read() {
  try { return JSON.parse(fs.readFileSync(file(), 'utf8')) } catch { return {} }
}

function getApiKey() {
  if (process.env.BALLDONTLIE_API_KEY) return process.env.BALLDONTLIE_API_KEY
  const { key, encrypted } = read()
  if (!key) return null
  try {
    return encrypted ? safeStorage.decryptString(Buffer.from(key, 'base64')) : key
  } catch { return null }
}

function setApiKey(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) { fs.writeFileSync(file(), '{}'); return }
  const encrypted = safeStorage.isEncryptionAvailable()
  const key = encrypted ? safeStorage.encryptString(trimmed).toString('base64') : trimmed
  fs.mkdirSync(path.dirname(file()), { recursive: true })
  fs.writeFileSync(file(), JSON.stringify({ key, encrypted }))
}

module.exports = { getApiKey, setApiKey }
