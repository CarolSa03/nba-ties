import { ref, onMounted, onUnmounted } from 'vue'
import { gamesService } from '@/services/games.service'

export function useGames() {
  const games = ref([])
  const apiGames = ref(0)
  const loading = ref(false)
  const error = ref('')
  const searched = ref(false)
  const progress = ref(null)
  const info = ref({ cached: false, stale: false, fetchedAt: 0, warning: '' })
  let stop = null

  onMounted(() => { stop = gamesService.onProgress((p) => (progress.value = p)) })
  onUnmounted(() => stop && stop())

  async function fetchGames(filters) {
    if (loading.value) return // ignore double clicks while a search is running
    loading.value = true
    error.value = ''
    try {
      const res = await gamesService.fetchGames(filters)
      games.value = res.games || []
      apiGames.value = res.api_games || 0
      info.value = { cached: res.cached, stale: res.stale, fetchedAt: res.fetchedAt, warning: res.warning }
      searched.value = true
    } catch (e) {
      error.value = e.message.replace(/^Error invoking remote method '[^']+': (Error: )?/, '')
      games.value = []
    } finally {
      loading.value = false
      progress.value = null
    }
  }

  return { games, apiGames, loading, error, searched, progress, info, fetchGames }
}
