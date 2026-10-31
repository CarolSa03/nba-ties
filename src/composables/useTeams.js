import { ref } from 'vue'
import { teamsService } from '@/services/teams.service'

export function useTeams() {
  const teams = ref([])
  const loadingTeams = ref(false)

  async function loadTeams() {
    loadingTeams.value = true
    try {
      const list = await teamsService.fetchTeams()
      teams.value = [...list].sort((a, b) => a.full_name.localeCompare(b.full_name))
    } catch {
      teams.value = []
    } finally {
      loadingTeams.value = false
    }
  }

  return { teams, loadingTeams, loadTeams }
}
