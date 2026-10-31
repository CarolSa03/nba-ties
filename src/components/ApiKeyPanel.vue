<script setup>
import { ref } from 'vue'
import Button from '@/components/ui/Button.vue'
import Input from '@/components/ui/Input.vue'

defineProps({ hasKey: Boolean, cacheCleared: Boolean })
const emit = defineEmits(['save', 'clear'])

const key = ref('')
function submit() {
  emit('save', key.value)
  key.value = ''
}
</script>
<template>
  <form class="mx-auto mb-4 grid max-w-xl gap-3 rounded-lg border bg-card p-4" @submit.prevent="submit">
    <label class="grid gap-1.5 text-sm">
      <span>{{ hasKey ? 'Replace your BallDontLie API key' : 'Paste your BallDontLie API key to get started' }}</span>
      <Input v-model="key" type="password" autocomplete="off" placeholder="Your key" />
    </label>
    <div class="flex items-center justify-between gap-3">
      <p class="text-xs text-muted-foreground">Saved encrypted on this computer.</p>
      <div class="flex items-center gap-1">
        <Button type="button" variant="ghost" size="sm" @click="emit('clear')">
          {{ cacheCleared ? 'Cleared' : 'Clear saved games' }}
        </Button>
        <Button type="submit" size="sm" :disabled="!key.trim()">Save key</Button>
      </div>
    </div>
  </form>
</template>
