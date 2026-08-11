<script setup lang="ts">
import { onMounted, ref } from 'vue'
import type { CardPerformance } from '@/domains/benefit-report/api/cardPerformance.mock'
import { formatAmountWithUnit, formatCompactAmount } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

type PerformanceState = 'before-tier1' | 'tier1-complete' | 'tier2-complete'

defineProps<{
  cards: CardPerformance[]
}>()

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과를 주기 위한 트리거.
// 실적 %와 무관하게 모든 카드가 같은 transition-duration으로 동시에 채워진다.
const isFilled = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isFilled.value = true
  })
})

function performanceState(card: CardPerformance): PerformanceState {
  if (card.currentAmount >= card.tier2TargetAmount) return 'tier2-complete'
  if (card.currentAmount >= card.tier1TargetAmount) return 'tier1-complete'
  return 'before-tier1'
}

function statusLabel(card: CardPerformance): string {
  const state = performanceState(card)

  if (state === 'tier2-complete') return '✅ 모든 구간 실적달성 완료'
  if (state === 'tier1-complete') return '✅ 1구간 실적달성 완료'
  return '다음 실적 달성'
}

function remainingAmountText(card: CardPerformance): string | null {
  const state = performanceState(card)

  if (state === 'tier2-complete') return null

  const remaining =
    state === 'tier1-complete'
      ? card.tier2TargetAmount - card.currentAmount
      : card.tier1TargetAmount - card.currentAmount

  return `${formatAmountWithUnit(remaining)} 남음`
}

function achievementRate(card: CardPerformance): number {
  if (card.tier2TargetAmount <= 0) return 0

  const rate = (card.currentAmount / card.tier2TargetAmount) * 100
  return Math.min(100, Math.floor(rate))
}
function tier1MarkerPercent(card: CardPerformance): number {
  if (card.tier2TargetAmount <= 0) return 0

  const rate = (card.tier1TargetAmount / card.tier2TargetAmount) * 100
  return Math.min(100, Math.floor(rate))
}
</script>

<template>
  <TransitionGroup tag="div" name="card-stagger" appear class="space-y-3">
    <div
      v-for="(card, index) in cards"
      :key="card.cardId"
      class="rounded-lg border border-divider bg-card p-3"
      :style="{ transitionDelay: `${index * 70}ms` }"
    >
      <div class="flex items-center gap-3">
        <CardImage :src="card.cardImageUrl" :alt="`${card.cardName} 카드 이미지`" small />
        <div class="min-w-0 flex-1">
          <div class="flex items-center justify-between gap-2">
            <span class="truncate text-body font-bold text-charcoal">{{ card.cardName }}</span>
            <span
              class="shrink-0 text-body font-bold"
              :class="achievementRate(card) >= 100 ? 'text-primary' : 'text-gray'"
            >
              {{ achievementRate(card) }}%
            </span>
          </div>
          <p class="mt-0.5 text-caption text-gray">
            {{ formatAmountWithUnit(card.currentAmount) }} /
            {{ formatAmountWithUnit(card.tier2TargetAmount) }}
          </p>
        </div>
      </div>

      <div class="relative mt-3 h-1.5 rounded-full bg-divider">
        <div
          class="gauge-fill h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
          :style="{ width: `${isFilled ? achievementRate(card) : 0}%` }"
        />
        <span
          class="absolute top-1/2 flex size-4 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold"
          :class="
            achievementRate(card) >= tier1MarkerPercent(card)
              ? 'bg-primary text-white'
              : 'border border-divider bg-card text-gray'
          "
          :style="{ left: `${tier1MarkerPercent(card)}%` }"
        >
          1
        </span>
        <span
          class="absolute top-full mt-2 -translate-x-1/2 text-[9px] whitespace-nowrap text-gray"
          :style="{ left: `${tier1MarkerPercent(card)}%` }"
        >
          {{ formatCompactAmount(card.tier1TargetAmount) }}
        </span>
        <span
          class="absolute top-1/2 right-0 flex size-4 -translate-y-1/2 items-center justify-center rounded-full text-[9px] font-bold"
          :class="
            achievementRate(card) >= 100
              ? 'bg-primary text-white'
              : 'border border-divider bg-card text-gray'
          "
        >
          2
        </span>
      </div>

      <div class="mt-5 flex items-center justify-between gap-2">
        <span
          class="text-caption font-semibold"
          :class="performanceState(card) === 'before-tier1' ? 'text-gray' : 'text-success'"
        >
          {{ statusLabel(card) }}
        </span>
        <span v-if="remainingAmountText(card)" class="text-caption font-bold text-primary">
          {{ remainingAmountText(card) }}
        </span>
      </div>
    </div>
  </TransitionGroup>
</template>

<style scoped>
.card-stagger-enter-active {
  transition:
    opacity 0.3s ease,
    transform 0.3s ease;
}

.card-stagger-enter-from {
  opacity: 0;
  transform: translateY(10px);
}

@media (prefers-reduced-motion: reduce) {
  .gauge-fill,
  .card-stagger-enter-active {
    transition: none !important;
  }
}
</style>
