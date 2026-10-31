<script setup>
import { cn } from '@/lib/utils'
const model = defineModel()
defineProps({ placeholder: String, options: Array, class: String })
</script>
<template>
  <select v-model="model"
    :class="cn('flex h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring dark:[color-scheme:dark]', !model && placeholder && 'text-muted-foreground', $props.class)">
    <option v-if="placeholder" value="" class="bg-card text-foreground">{{ placeholder }}</option>
    <option v-for="o in options" :key="o.value" :value="o.value" class="bg-card text-foreground">{{ o.label }}</option>
  </select>
</template>
