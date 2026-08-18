<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCheck } from '@lucide/vue'
import type { PerformanceCardItem } from '@/domains/benefit-report/api/performanceReport'
import { formatAmountWithUnit } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'
import { captureEvent } from '@/plugins/posthog'

defineProps<{
  cards: PerformanceCardItem[]
}>()

const router = useRouter()

// 카드를 누르면 그 카드로 필터링된 전체 결제 내역으로 이동한다.
function goToCardHistory(userCardId: string) {
  captureEvent('performance_card_clicked', { userCardId })
  router.push({ name: 'home-benefits', query: { userCardId } })
}

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

// 게이지 왼쪽에 표시할 달성 구간 번호. 더 채울 구간이 없는 최고 구간까지 다 채웠으면
// 지나온 구간이 몇 개든 왼쪽은 항상 시작 구간(1)으로 표시하고 오른쪽에 최종 달성 구간을 보여준다.
// (구간별 정확한 목표금액을 API가 안 내려줘서, 최고 구간 달성 후엔 1구간 금액을 알 방법이 없다.)
function achievedTierNumber(card: PerformanceCardItem): number | null {
  if (!isAchieved(card)) return null
  return card.nextTier === null ? 1 : card.currentTier
}

// 게이지 오른쪽에 표시할 목표(또는 최종 달성) 구간 번호.
function targetTierNumber(card: PerformanceCardItem): number | null {
  if (isAchieved(card)) return card.nextTier === null ? card.currentTier : card.nextTier
  return card.currentTier > 0 ? card.currentTier : card.nextTier
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
    <button
      v-for="(card, index) in cards"
      :key="card.userCardId"
      type="button"
      class="block w-full rounded-lg border border-divider bg-card p-3 text-left"
      :style="{ transitionDelay: `${index * 70}ms` }"
      @click="goToCardHistory(card.userCardId)"
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

      <div
        v-if="hasTierInfo(card)"
        class="relative mt-3 h-1.5 rounded-full bg-divider"
        role="progressbar"
        :aria-label="`${card.cardName} 실적 달성률`"
        aria-valuemin="0"
        aria-valuemax="100"
        :aria-valuenow="displayRate(card)"
      >
        <div
          class="gauge-fill h-full rounded-full bg-primary transition-[width] duration-1000 ease-out"
          :style="{ width: `${isFilled ? displayRate(card) : 0}%` }"
        />
        <span
          v-if="achievedTierNumber(card) !== null"
          class="absolute left-0 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white"
        >
          {{ achievedTierNumber(card) }}
        </span>
        <span
          v-if="targetTierNumber(card) !== null"
          class="absolute right-0 top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold"
          :class="
            isAchieved(card) && card.nextTier === null
              ? 'bg-primary text-white'
              : 'border border-divider bg-card text-gray'
          "
        >
          {{ targetTierNumber(card) }}
        </span>
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
    </button>
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
