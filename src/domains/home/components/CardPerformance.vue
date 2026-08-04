<script setup lang="ts">
import { computed } from 'vue'
import type { HomeOwnedCard } from '@/domains/home/mocks/ownedCards'

interface Props {
  card: HomeOwnedCard
}

const props = defineProps<Props>()
const currencyFormatter = new Intl.NumberFormat('ko-KR')

const progressRate = computed(() => {
  if (props.card.performance.targetAmount <= 0) return 0

  const rate = Math.floor(
    (props.card.performance.currentAmount / props.card.performance.targetAmount) * 100,
  )
  return Math.min(Math.max(rate, 0), 100)
})
const remainingAmount = computed(() =>
  Math.max(props.card.performance.targetAmount - props.card.performance.currentAmount, 0),
)

function formatAmount(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}
</script>

<template>
  <section class="border-b border-divider px-5 py-4" aria-labelledby="card-performance-title">
    <div class="flex items-center justify-between gap-3">
      <h3 id="card-performance-title" data-performance-rate class="text-caption font-semibold">
        실적 달성 현황({{ progressRate }}%)
      </h3>
      <p class="shrink-0 text-caption text-gray">
        {{ formatAmount(card.performance.currentAmount) }} /
        {{ formatAmount(card.performance.targetAmount) }}
      </p>
    </div>

    <div
      class="mt-2 h-2 overflow-hidden rounded-full bg-divider"
      role="progressbar"
      aria-label="카드 실적 달성률"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="progressRate"
    >
      <div
        class="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
        :style="{ width: `${progressRate}%` }"
      />
    </div>

    <p data-performance-remaining class="mt-2 text-caption text-gray">
      실적까지
      <strong class="font-semibold text-charcoal">{{ formatAmount(remainingAmount) }}</strong>
      남았어요
    </p>
  </section>
</template>
