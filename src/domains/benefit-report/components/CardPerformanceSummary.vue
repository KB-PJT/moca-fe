<script setup lang="ts">
import type { PerformanceSummary } from '@/domains/benefit-report/api/performanceReport'

defineProps<{
  summary: PerformanceSummary
}>()
</script>

<template>
  <div class="flex items-center justify-between gap-2 rounded-lg bg-accent px-4 py-3.5">
    <p class="text-[18px] leading-6 font-bold text-charcoal">실적 달성률</p>
    <span class="shrink-0 rounded-full bg-card px-2 py-1 text-caption font-bold text-primary">
      {{ summary.achievedCardCount }}/{{ summary.cardCount }} 달성
    </span>
  </div>
</template>
