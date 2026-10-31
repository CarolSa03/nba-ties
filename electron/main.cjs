const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')
const { getGames, getTeams } = require('./lib/client.cjs')
const { getApiKey, setApiKey } = require('./lib/settings.cjs')
const cache = require('./lib/cache.cjs')
const { validateFilters } = require('./lib/validate.cjs')

const isDev = process.env.ELECTRON_DEV === '1'

ipcMain.handle('games:get', (event, filters) =>
  getGames(validateFilters(filters), (p) => event.sender.send('games:progress', p))
)
ipcMain.handle('teams:get', () => getTeams())
ipcMain.handle('cache:clear', () => { cache.clear(); return true })
ipcMain.handle('settings:hasKey', async() => !!(await getApiKey()))
ipcMain.handle('settings:setKey', async(_e, key) => { await setApiKey(key); return !!(await getApiKey()) })

function createWindow() {
  const win = new BrowserWindow({
    icon: path.join(__dirname, 'icon.png'),
    width: 640, height: 780, minWidth: 480, minHeight: 560,
    backgroundColor: '#060607',
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true, nodeIntegration: false, sandbox: true
    }
  })
  win.webContents.setWindowOpenHandler(({ url }) => { shell.openExternal(url); return { action: 'deny' } })
  if (isDev) win.loadURL('http://localhost:5173')
  else win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => BrowserWindow.getAllWindows().length === 0 && createWindow())
})
app.on('before-quit', () => cache.flush())
app.on('window-all-closed', () => process.platform !== 'darwin' && app.quit())
