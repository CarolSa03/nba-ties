<script setup>
import { AlertCircle } from 'lucide-vue-next'
import { cn } from '@/lib/utils'
defineProps({ variant: { type: String, default: 'error' } })
</script>
<template>
  <div :class="cn('mx-auto mb-4 flex max-w-xl items-start gap-3 rounded-lg border p-3 text-sm',
    variant === 'error' ? 'border-destructive/60 bg-destructive/20' : 'border-tie/50 bg-tie/10')">
    <AlertCircle :class="cn('mt-0.5 h-4 w-4 shrink-0', variant === 'warning' && 'text-tie')" />
    <p><slot /></p>
  </div>
</template>
