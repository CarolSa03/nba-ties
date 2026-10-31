const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  getGames: (filters) => ipcRenderer.invoke('games:get', filters),
  getTeams: () => ipcRenderer.invoke('teams:get'),
  clearCache: () => ipcRenderer.invoke('cache:clear'),
  hasApiKey: () => ipcRenderer.invoke('settings:hasKey'),
  setApiKey: (key) => ipcRenderer.invoke('settings:setKey', key),
  onProgress: (cb) => {
    const handler = (_e, p) => cb(p)
    ipcRenderer.on('games:progress', handler)
    return () => ipcRenderer.removeListener('games:progress', handler)
  }
})
