// stores the API key encrypted (OS keychain via safeStorage) in the app user data folder
const { app, safeStorage } = require('electron')
const fs = require('fs')
const path = require('path')

const file = () => path.join(app.getPath('userData'), 'settings.json')

function read() {
  try { return JSON.parse(fs.readFileSync(file(), 'utf8')) } catch { return {} }
}

function write(data) {
  fs.mkdirSync(path.dirname(file()), {recursive: true})
  fs.writeFileSync(file(), JSON.stringify(data))
}

async function save(plain) {
  const encrypted = await safeStorage.isAsyncEncryptionAvailable()
  const key = encrypted ? (await safeStorage.encryptStringAsync(plain)).toString('base64') : plain
  write({key, encrypted})
}

async function getApiKey() {
  if (process.env.BALLDONTLIE_API_KEY) return process.env.BALLDONTLIE_API_KEY
  const { key, encrypted } = read()
  if (!key) return null
  if (!key) return null
  try {
    const {result, shouldReEncrypt} = await safeStorage.decryptStringAsync(Buffer.from(key, 'base64'))
    if(shouldReEncrypt) await save(result) // os key changed, so store it again with new one :D
    return result
  } catch { return null }
}

async function setApiKey(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) { fs.writeFileSync(file(), '{}'); return }
  await save(trimmed)
}

module.exports = { getApiKey, setApiKey }
