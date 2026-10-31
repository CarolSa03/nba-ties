<script setup>
import { Loader2, Search } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'
import Switch from '@/components/ui/Switch.vue'
import Tabs from '@/components/ui/Tabs.vue'
import Select from '@/components/ui/Select.vue'
import { PRESETS, VIEW_OPTIONS } from '@/constants'

// `filters` is the reactive state from useGameFilters; the form edits it directly.
defineProps({ filters: Object, teamOptions: Array, canLoadTeams: Boolean, loading: Boolean })
defineEmits(['search', 'load-teams', 'reset-teams'])
</script>
<template>
  <form class="mx-auto mb-6 grid max-w-xl gap-4" @submit.prevent="$emit('search')">
    <div>
      <p class="mb-2 text-xs text-muted-foreground">When</p>
      <Tabs v-model="filters.preset" :options="PRESETS" class="flex-wrap" />
    </div>

    <div v-if="filters.preset === 'custom'" class="grid grid-cols-3 gap-2">
      <label class="grid gap-1 text-xs text-muted-foreground">Season
        <Input v-model="filters.season" type="number" min="1946" placeholder="2024" />
      </label>
      <label class="grid gap-1 text-xs text-muted-foreground">From
        <Input v-model="filters.startDate" type="date" />
      </label>
      <label class="grid gap-1 text-xs text-muted-foreground">To
        <Input v-model="filters.endDate" type="date" />
      </label>
    </div>

    <div>
      <div class="mb-2 flex items-center justify-between">
        <p class="text-xs text-muted-foreground">Teams</p>
        <div class="flex items-center gap-1">
          <Button v-if="canLoadTeams" type="button" variant="ghost" size="sm" @click="$emit('load-teams')">Load teams</Button>
          <Button v-if="filters.teamA || filters.teamB" type="button" variant="ghost" size="sm" @click="$emit('reset-teams')">Clear teams</Button>
        </div>
      </div>
      <div class="grid grid-cols-2 gap-2">
        <Select v-model="filters.teamA" :options="teamOptions" placeholder="Team A" />
        <Select v-model="filters.teamB" :options="teamOptions" placeholder="Team B" />
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-3">
      <Select v-model="filters.viewType" :options="VIEW_OPTIONS" class="w-auto min-w-[11rem] flex-1" />
      <label class="flex items-center gap-2 text-sm">
        <Switch v-model="filters.tiedOnly" /> Ties only
      </label>
    </div>

    <Button type="submit" class="h-10 w-full" :disabled="loading">
      <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
      <Search v-else class="h-4 w-4" />
      {{ loading ? 'Searching' : 'Find games' }}
    </Button>
  </form>
</template>
