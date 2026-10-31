export const teamsService = {
  async fetchTeams() {
    const data = await window.api.getTeams()
    return data.data || []
  }
}
