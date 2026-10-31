<script setup>
import { cn } from '@/lib/utils'
defineProps({ class: String })
</script>
<template>
  <span :class="cn('inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium', $props.class)"><slot /></span>
</template>
