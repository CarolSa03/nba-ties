import { ref, onMounted } from 'vue'

export function useApiKey(onReady = () => {}) {
  const hasKey = ref(true)
  const showPanel = ref(false)
  const cacheCleared = ref(false)

  onMounted(async () => {
    hasKey.value = await window.api.hasApiKey()
    showPanel.value = !hasKey.value
    if (hasKey.value) onReady()
  })

  async function saveKey(key) {
    hasKey.value = await window.api.setApiKey(key)
    if (hasKey.value) {
      showPanel.value = false
      onReady()
    }
  }

  async function clearCache() {
    await window.api.clearCache()
    cacheCleared.value = true
    setTimeout(() => (cacheCleared.value = false), 2500)
  }

  return { hasKey, showPanel, cacheCleared, saveKey, clearCache }
}
