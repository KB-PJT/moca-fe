<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { CircleCheck } from '@lucide/vue'
import type { PerformanceCardItem } from '@/domains/benefit-report/api/performanceReport'
import { formatAmountWithUnit } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

defineProps<{
  cards: PerformanceCardItem[]
}>()

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과를 주기 위한 트리거.
// 실적 %와 무관하게 모든 카드가 같은 transition-duration으로 동시에 채워진다.
const isFilled = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isFilled.value = true
  })
})

// 카드 원천 데이터에 실적 tier가 없으면 currentTier=0, nextTier=null로 내려온다.
function hasTierInfo(card: PerformanceCardItem): boolean {
  return card.currentTier > 0 || card.nextTier !== null
}

function displayRate(card: PerformanceCardItem): number {
  return Math.min(100, Math.max(0, Math.floor(card.achievementRate)))
}

function isAchieved(card: PerformanceCardItem): boolean {
  return hasTierInfo(card) && card.isCurrentTierAchieved
}

function statusLabel(card: PerformanceCardItem): string {
  if (!hasTierInfo(card)) return '실적 구간 정보 없음'
  if (card.isCurrentTierAchieved && card.nextTier === null) return '모든 구간 실적달성 완료'
  if (card.isCurrentTierAchieved) return `${card.currentTier}구간 실적달성 완료`
  return '다음 실적 달성까지'
}

function remainingAmountText(card: PerformanceCardItem): string | null {
  if (!hasTierInfo(card) || card.isCurrentTierAchieved) return null
  return `${formatAmountWithUnit(card.remainingAmountToNextTier)} 남음`
}
</script>

<template>
  <TransitionGroup tag="div" name="card-stagger" appear class="space-y-3">
    <div
      v-for="(card, index) in cards"
      :key="card.userCardId"
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
              :class="isAchieved(card) ? 'text-primary' : 'text-gray'"
            >
              {{ displayRate(card) }}%
            </span>
          </div>
          <p v-if="hasTierInfo(card)" class="mt-0.5 text-caption text-gray">
            {{ formatAmountWithUnit(card.currentPerformanceAmount) }} /
            {{ formatAmountWithUnit(card.currentTierTargetAmount) }}
          </p>
        </div>
      </div>

      <div v-if="hasTierInfo(card)" class="mt-3 h-1.5 rounded-full bg-divider">
        <div
          class="gauge-fill h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
          :style="{ width: `${isFilled ? displayRate(card) : 0}%` }"
        />
      </div>

      <div class="mt-3 flex items-center justify-between gap-2">
        <span
          class="flex items-center gap-1 text-caption font-semibold"
          :class="isAchieved(card) ? 'text-success' : 'text-gray'"
        >
          <CircleCheck v-if="isAchieved(card)" class="size-3.5" />
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
