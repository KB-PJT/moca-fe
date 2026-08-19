<script setup lang="ts">
import { computed } from 'vue'
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'

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
      class="mt-2 h-2 overflow-hidden rounded-full bg-[#F3F0ED]"
      role="progressbar"
      aria-label="카드 실적 달성률"
      aria-valuemin="0"
      aria-valuemax="100"
      :aria-valuenow="progressRate"
    >
      <div
        :key="card.id"
        data-performance-fill
        class="performance-progress-fill h-full w-full rounded-full bg-[linear-gradient(90deg,#F4D7C2_0%,#FFB37D_55%,#FF8836_100%)] shadow-[0_0_8px_rgba(255,136,54,0.22)]"
        :style="{ '--performance-progress': progressRate / 100 }"
      />
    </div>

    <p data-performance-remaining class="mt-2 text-caption text-gray">
      실적까지
      <strong class="font-semibold text-charcoal">{{ formatAmount(remainingAmount) }}</strong>
      남았어요
    </p>
  </section>
</template>

<style scoped>
.performance-progress-fill {
  transform-origin: left;
  animation: fill-performance-progress 800ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

@keyframes fill-performance-progress {
  from {
    transform: scaleX(0);
  }

  to {
    transform: scaleX(var(--performance-progress));
  }
}

@media (prefers-reduced-motion: reduce) {
  .performance-progress-fill {
    animation: none;
    transform: scaleX(var(--performance-progress));
  }
}
</style>
