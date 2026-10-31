<script setup>
import { computed } from 'vue'
import Badge from '@/components/ui/Badge.vue'
import PeriodStrip from '@/components/PeriodStrip.vue'
import { formatDate } from '@/utils/formatters'

const props = defineProps({ game: Object })

const score = computed(() => {
  const [v, h] = props.game.final_score.split('-').map(Number)
  return { v, h, winner: v > h ? 'v' : 'h' }
})
const cls = (side) => (score.value.winner === side ? 'font-semibold' : 'text-muted-foreground')
</script>
<template>
  <li class="rounded-lg border bg-card p-3.5">
    <div class="mb-2 flex items-center justify-between text-xs text-muted-foreground">
      <span>{{ formatDate(game.date) }}</span>
      <Badge v-if="game.has_ot" class="border-tie/50 text-tie">Overtime</Badge>
    </div>
    <div class="mb-3 grid gap-0.5">
      <div class="flex items-center justify-between">
        <span :class="cls('v')">{{ game.visitor_team }}</span>
        <span :class="['tabular-nums', cls('v')]">{{ score.v }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span :class="cls('h')">{{ game.home_team }}</span>
        <span :class="['tabular-nums', cls('h')]">{{ score.h }}</span>
      </div>
    </div>
    <PeriodStrip :periods="game.periods" :tied="game.valid_ties" />
  </li>
</template>
