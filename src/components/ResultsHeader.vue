<script setup>
import { RefreshCw } from 'lucide-vue-next'
import Button from '@/components/ui/Button.vue'
import Tabs from '@/components/ui/Tabs.vue'
import { SORT_OPTIONS } from '@/constants'
import { timeAgo } from '@/utils/formatters'

const sortDescending = defineModel('sortDescending', { type: Boolean })
defineProps({ count: Number, checked: Number, info: Object, loading: Boolean })
defineEmits(['refresh'])
</script>
<template>
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <p class="text-sm text-muted-foreground">
      <span class="font-medium text-foreground">{{ count }}</span>
      {{ count === 1 ? 'game' : 'games' }} found
      <span v-if="checked !== count">({{ checked }} checked)</span>
      <span v-if="info.cached && !info.stale">, saved {{ timeAgo(info.fetchedAt) }}</span>
    </p>
    <div class="flex items-center gap-2">
      <Tabs v-model="sortDescending" :options="SORT_OPTIONS" />
      <Button variant="outline" size="sm" class="h-9" :disabled="loading" @click="$emit('refresh')">
        <RefreshCw class="h-3.5 w-3.5" /> Refresh
      </Button>
    </div>
  </div>
</template>
