<script setup lang="ts">
import { ChevronLeft } from '@lucide/vue'

interface Props {
  title?: string
  showBack?: boolean
  transparent?: boolean
}

withDefaults(defineProps<Props>(), {
  showBack: true,
  transparent: false,
})

const emit = defineEmits<{
  back: []
}>()
</script>

<template>
  <header
    class="shrink-0 pt-[var(--safe-area-top)]"
    :class="transparent ? 'bg-transparent' : 'bg-background border-divider border-b'"
  >
    <div class="flex h-[var(--app-bar-height)] items-center justify-between px-2">
      <button
        v-if="showBack"
        type="button"
        class="flex size-9 items-center justify-center"
        @click="emit('back')"
      >
        <ChevronLeft class="text-charcoal size-6" />
      </button>
      <div v-else class="size-9" />

      <p class="text-subheading text-charcoal flex-1 truncate text-center">
        {{ title }}
      </p>

      <div class="flex size-9 items-center justify-end">
        <slot name="right" />
      </div>
    </div>
  </header>
</template>
