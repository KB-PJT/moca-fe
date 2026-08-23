<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { CircleCheck } from '@lucide/vue'
import type {
  PerformanceCardItem,
  PerformanceTier,
} from '@/domains/benefit-report/api/performanceReport'
import { formatAmountWithUnit, formatCompactAmount } from '@/shared/utils/format'
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

function hasTierInfo(card: PerformanceCardItem): boolean {
  return card.tiers.length > 0
}

// 게이지 전체가 나타내는 최종(최고) 구간 목표금액. 각 구간 배지 위치와 채움 비율을
// 이 금액 기준으로 계산해 전체 구간을 실제 비율대로 한 막대에 그린다.
function maxTierTarget(card: PerformanceCardItem): number {
  if (!card.tiers.length) return 0
  return Math.max(...card.tiers.map((tier) => tier.targetAmount))
}

// achievementRate는 "다음 구간까지"만 기준으로 한 값이라, 여러 구간을 한 막대에 실제
// 비율대로 그릴 땐 쓸 수 없어 최종 구간 목표금액 기준으로 다시 계산한다.
function displayRate(card: PerformanceCardItem): number {
  const max = maxTierTarget(card)
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, Math.floor((card.currentPerformanceAmount / max) * 100)))
}

function isAchieved(card: PerformanceCardItem): boolean {
  return hasTierInfo(card) && card.isCurrentTierAchieved
}

// 구간 배지를 막대 위 몇 %지점에 놓을지.
function tierPositionPercent(card: PerformanceCardItem, tier: PerformanceTier): number {
  const max = maxTierTarget(card)
  if (max <= 0) return 0
  return Math.min(100, Math.max(0, (tier.targetAmount / max) * 100))
}

function isTierAchieved(card: PerformanceCardItem, tier: PerformanceTier): boolean {
  return card.currentPerformanceAmount >= tier.targetAmount
}

// 구간 배지·캡션은 기본적으로 그 지점 가운데 정렬하되, 막대 양 끝(0%/100%)에 가까운
// 구간은 가운데 정렬하면(특히 100% 지점은 배지 절반이 항상 막대 밖으로 튀어나와
// 카드 상단의 "100%" 텍스트 끝선과 안 맞아 보인다) 안쪽 가장자리에 딱 붙인다.
function tierMarkerAlign(
  card: PerformanceCardItem,
  tier: PerformanceTier,
): 'start' | 'center' | 'end' {
  const percent = tierPositionPercent(card, tier)
  if (percent <= 10) return 'start'
  if (percent >= 90) return 'end'
  return 'center'
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
      class="block w-full rounded-lg border border-divider bg-card p-4 text-left shadow-btn"
      :style="{ transitionDelay: `${index * 70}ms` }"
      @click="goToCardHistory(card.userCardId)"
    >
      <div class="flex items-center gap-3">
        <CardImage
          :src="card.cardImageUrl"
          :alt="`${card.cardName} 카드 이미지`"
          small
          loading="lazy"
          fetch-priority="low"
        />
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
            {{ formatAmountWithUnit(maxTierTarget(card)) }}
          </p>
        </div>
      </div>

      <div
        v-if="hasTierInfo(card)"
        class="relative mt-4 h-1.5 rounded-full bg-divider"
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
          v-for="tier in card.tiers"
          :key="tier.tier"
          class="absolute top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold"
          :style="
            tierMarkerAlign(card, tier) === 'center'
              ? { left: `${tierPositionPercent(card, tier)}%` }
              : undefined
          "
          :class="[
            isTierAchieved(card, tier)
              ? 'bg-primary text-white'
              : 'border border-divider bg-card text-gray',
            tierMarkerAlign(card, tier) === 'start' && 'left-0',
            tierMarkerAlign(card, tier) === 'center' && '-translate-x-1/2',
            tierMarkerAlign(card, tier) === 'end' && 'right-0',
          ]"
        >
          {{ tier.tier }}
          <span
            class="absolute top-full mt-1 whitespace-nowrap text-[10px] font-normal text-gray"
            :class="{
              'left-0': tierMarkerAlign(card, tier) === 'start',
              'left-1/2 -translate-x-1/2': tierMarkerAlign(card, tier) === 'center',
              'right-0': tierMarkerAlign(card, tier) === 'end',
            }"
          >
            {{ formatCompactAmount(tier.targetAmount) }}
          </span>
        </span>
      </div>

      <div class="mt-9 flex items-center justify-between gap-2">
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
