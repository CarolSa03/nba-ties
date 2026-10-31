<script setup>
import { cn } from '@/lib/utils'
const model = defineModel()
defineProps({ options: Array, class: String })
</script>
<template>
  <div role="tablist" :class="cn('inline-flex min-h-9 items-center gap-0.5 rounded-lg bg-muted p-1 text-muted-foreground', $props.class)">
    <button v-for="o in options" :key="o.value" type="button" role="tab" :aria-selected="model === o.value" @click="model = o.value"
      :class="cn('inline-flex items-center rounded-md px-2.5 py-1 text-sm font-medium transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', model === o.value && 'bg-background text-foreground')">
      {{ o.label }}
    </button>
  </div>
</template>
