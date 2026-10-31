<script setup>
import { computed } from 'vue'
import { useDark } from '@vueuse/core'
import { KeyRound, Sun, Moon } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Notice from '@/components/ui/Notice.vue'
import ApiKeyPanel from '@/components/ApiKeyPanel.vue'
import FilterForm from '@/components/FilterForm.vue'
import ResultsHeader from '@/components/ResultsHeader.vue'
import GameCard from '@/components/GameCard.vue'
import { useTeams } from '@/composables/useTeams'
import { useGames } from '@/composables/useGames'
import { useGameFilters } from '@/composables/useGameFilters'
import { useApiKey } from '@/composables/useApiKey'
import { filterGamesByTeams, sortGamesByDate } from '@/utils/gameFilters'
import { timeAgo } from '@/utils/formatters'

const isDark = useDark({ selector: 'html', initialValue: 'dark' })

const { teams, loadTeams } = useTeams()
const { games, apiGames, loading, error, searched, progress, info, fetchGames } = useGames()
const { filters, resetTeams, getFilters } = useGameFilters(
  (name) => teams.value.find((t) => t.full_name === name)?.id
)
const { hasKey, showPanel, cacheCleared, saveKey, clearCache } = useApiKey(loadTeams)

const teamOptions = computed(() => teams.value.map((t) => ({ value: t.full_name, label: t.full_name })))

const visibleGames = computed(() =>
  sortGamesByDate(filterGamesByTeams(games.value, filters.teamA, filters.teamB), filters.sortDescending)
)

const search = () => fetchGames(getFilters())
const refresh = () => fetchGames({ ...getFilters(), refresh: true })
</script>

<template>
  <div class="mx-auto max-w-xl px-4 pb-10 pt-5 lg:max-w-5xl">
    <header class="mb-6 flex items-center justify-between">
      <h1 class="text-lg font-medium">Tied games</h1>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="sm" @click="showPanel = !showPanel"><KeyRound class="h-4 w-4" /> API key</Button>
        <Button variant="ghost" size="sm" class="h-9 w-9 rounded-full p-0" aria-label="Toggle theme" @click="isDark = !isDark">
          <Moon v-if="isDark" class="h-5 w-5" /><Sun v-else class="h-5 w-5" />
        </Button>
      </div>
    </header>

    <ApiKeyPanel v-if="showPanel" :has-key="hasKey" :cache-cleared="cacheCleared" @save="saveKey" @clear="clearCache" />

    <FilterForm
      :filters="filters"
      :team-options="teamOptions"
      :can-load-teams="hasKey && !teams.length"
      :loading="loading"
      @search="search"
      @load-teams="loadTeams"
      @reset-teams="resetTeams"
    />

    <p v-if="loading && progress" class="mb-4 text-center text-xs text-muted-foreground">
      {{ progress.fetched }} games checked so far. Free API keys are rate limited, so this can take a minute.
    </p>

    <Notice v-if="error">{{ error }}</Notice>
    <Notice v-else-if="info.stale" variant="warning">
      Could not update from BallDontLie ({{ info.warning }}). Showing saved results from {{ timeAgo(info.fetchedAt) }}.
    </Notice>

    <ResultsHeader
      v-if="searched && !error && visibleGames.length"
      v-model:sort-descending="filters.sortDescending"
      :count="visibleGames.length"
      :checked="apiGames"
      :info="info"
      :loading="loading"
      @refresh="refresh"
    />

    <ul class="grid gap-3 lg:grid-cols-2">
      <GameCard v-for="g in visibleGames" :key="g.id" :game="g" />
    </ul>

    <p v-if="!searched && !loading" class="py-12 text-center text-sm text-muted-foreground">
      Choose a time range and tap Find games.
    </p>
    <p v-else-if="searched && !visibleGames.length && !error && !loading" class="py-12 text-center text-sm text-muted-foreground">
      No games found. Try a longer range, other teams, or turn off "Ties only".
    </p>
  </div>
</template>
