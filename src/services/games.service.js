export const gamesService = {
  fetchGames(filters) {
    return window.api.getGames({ ...filters })
  },
  onProgress(cb) {
    return window.api.onProgress(cb)
  }
}
