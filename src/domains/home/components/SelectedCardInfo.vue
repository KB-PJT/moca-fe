<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'

interface Props {
  card: HomeOwnedCard
  cardCount: number
  activeIndex?: number
}

withDefaults(defineProps<Props>(), {
  activeIndex: 0,
})
</script>

<template>
  <div class="mt-3">
    <div
      v-if="cardCount > 0"
      data-card-indicator-track
      class="relative h-px w-full overflow-hidden bg-divider"
      aria-hidden="true"
    >
      <div
        data-card-indicator-active
        class="absolute inset-y-0 bg-primary transition-[left] duration-300 ease-out"
        :style="{
          width: `${100 / cardCount}%`,
          left: `${(100 / cardCount) * activeIndex}%`,
          maskImage: 'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
          WebkitMaskImage:
            'linear-gradient(to right, transparent, black 25%, black 75%, transparent)',
        }"
      />
    </div>

    <div
      data-selected-card-info
      class="flex min-h-16 items-center gap-3 border-b border-divider px-5"
    >
      <span
        data-selected-card-accent
        class="size-2.5 shrink-0 rounded-full"
        :style="{
          backgroundColor: card.accentColor,
          backgroundImage: 'linear-gradient(135deg, rgba(255, 255, 255, 0.35), transparent 65%)',
        }"
        aria-hidden="true"
      />
      <p data-selected-card-name class="min-w-0 flex-1 truncate text-subheading text-charcoal">
        {{ card.name }}
      </p>
      <RouterLink
        :to="{ name: 'card-detail', params: { id: card.id }, query: { from: 'home' } }"
        class="flex shrink-0 items-center gap-0.5 text-body font-medium text-brown"
      >
        상세보기
        <ChevronRight class="size-4" aria-hidden="true" />
      </RouterLink>
    </div>
  </div>
</template>
