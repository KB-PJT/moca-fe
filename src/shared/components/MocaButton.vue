<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { computed } from 'vue'
import { LoaderCircle } from '@lucide/vue'
import { Button } from '@/shared/ui/button'
import { cn } from '@/shared/utils/cn'

interface Props {
  variant?: 'primary' | 'secondary' | 'ghost'
  block?: boolean
  loading?: boolean
  disabled?: boolean
  type?: 'button' | 'submit'
  class?: HTMLAttributes['class']
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'primary',
  block: false,
  loading: false,
  disabled: false,
  type: 'button',
})

const shadcnVariant = computed(() => {
  if (props.variant === 'secondary') return 'outline'
  if (props.variant === 'ghost') return 'ghost'
  return 'default'
})

const variantClass = computed(() => {
  if (props.variant === 'secondary')
    return 'border-primary! bg-card! text-primary shadow-none! hover:bg-accent! hover:text-primary'
  if (props.variant === 'ghost') return 'text-charcoal'
  return 'hover:bg-primary-hover!'
})

const stateClass = computed(() => {
  if (props.loading) return 'disabled:opacity-100!'
  if (props.disabled)
    return 'disabled:border-disabled! disabled:bg-disabled! disabled:[color:white]! disabled:opacity-100!'
  return ''
})
</script>

<template>
  <Button
    :type="type"
    :variant="shadcnVariant"
    :disabled="disabled || loading"
    :aria-busy="loading"
    :class="cn(block && 'w-full', variantClass, stateClass, props.class)"
  >
    <LoaderCircle v-if="loading" class="size-4 animate-spin" />
    <slot />
  </Button>
</template>
