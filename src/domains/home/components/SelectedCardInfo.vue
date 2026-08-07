<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'

interface Props {
  card: HomeOwnedCard
}

defineProps<Props>()
</script>

<template>
  <div class="mt-3 flex min-h-18 items-center gap-3 border-y border-divider px-5">
    <span
      class="size-7 shrink-0 rounded-full"
      :style="{ backgroundColor: card.accentColor }"
      aria-hidden="true"
    />
    <p data-selected-card-name class="min-w-0 flex-1 truncate text-subheading text-charcoal">
      {{ card.name }}
    </p>
    <RouterLink
      :to="{ name: 'card-detail', params: { id: card.id } }"
      class="flex shrink-0 items-center gap-0.5 text-body font-medium text-brown"
    >
      상세보기
      <ChevronRight class="size-4" aria-hidden="true" />
    </RouterLink>
  </div>
</template>
