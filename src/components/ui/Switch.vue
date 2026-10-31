<script setup>
import { cn } from '@/lib/utils'
const model = defineModel({ type: Boolean })
defineProps({ class: String })
</script>
<template>
  <button type="button" role="switch" :aria-checked="model" @click="model = !model"
    :class="cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring', model ? 'bg-primary' : 'bg-input', $props.class)">
    <span :class="cn('pointer-events-none block h-4 w-4 rounded-full bg-background shadow transition-transform', model ? 'translate-x-4' : 'translate-x-0')" />
  </button>
</template>
