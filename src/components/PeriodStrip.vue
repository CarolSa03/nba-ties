<script setup>
import { computed } from 'vue'
import { cn } from '@/lib/utils'

const props = defineProps({ periods: Object, tied: Array })

// Backend formats: Q -> "cum (quarter)", OT -> "ot (cum)". Normalise to a running score.
const cells = computed(() => {
  const tiedLabels = new Set((props.tied || []).map((t) => t.split(' ')[0]))
  return Object.entries(props.periods || {}).map(([label, raw]) => {
    const m = raw.match(/^(.*?) \((.*)\)$/)
    const [a, b] = m ? [m[1], m[2]] : [raw, '']
    return { label, cum: label.startsWith('OT') ? b : a, tied: tiedLabels.has(label) }
  })
})
</script>
<template>
  <div class="grid grid-cols-[repeat(auto-fit,minmax(78px,1fr))] gap-1.5">
    <div v-for="c in cells" :key="c.label"
      :class="cn('rounded-md px-2 py-1.5 text-center', c.tied ? 'bg-tie/15 ring-1 ring-tie/60' : 'bg-muted/60')">
      <div :class="cn('text-[11px]', c.tied ? 'font-semibold text-tie' : 'text-muted-foreground')">
        {{ c.label }}{{ c.tied ? ' tied' : '' }}
      </div>
      <div class="text-sm font-semibold tabular-nums">{{ c.cum }}</div>
    </div>
  </div>
</template>
