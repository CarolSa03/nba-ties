<script setup>
import { cva } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const variants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        ghost: 'hover:bg-accent hover:text-accent-foreground'
      },
      size: { default: 'h-9 px-4', sm: 'h-8 px-3 text-xs' }
    },
    defaultVariants: { variant: 'default', size: 'default' }
  }
)
defineProps({ variant: String, size: String, class: String })
</script>
<template>
  <button :class="cn(variants({ variant, size }), $props.class)"><slot /></button>
</template>
