<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type {
  PerformanceSummary,
  PerformanceSummaryCardItem,
} from '@/domains/benefit-report/api/performanceReport'
import { formatAmountWithUnit } from '@/shared/utils/format'

interface NearestAchievement {
  cardName: string
  remainingAmount: number
}

const props = defineProps<{
  summary: PerformanceSummary
  // 카드별 실적 목록(다른 API 응답)에서 계산해 넘겨받는, 미달성 카드 중 남은 금액이
  // 가장 적은 카드. 두 API가 다 응답해야 채워지므로 아직 없을 수 있어 optional.
  nearestAchievement?: NearestAchievement | null
}>()

const RADIUS = 42
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

const achievementPercent = computed(() => {
  if (props.summary.cardCount === 0) return 0
  return Math.round((props.summary.achievedCardCount / props.summary.cardCount) * 100)
})

// 혜택 탭 도넛(BenefitDonutChart, Chart.js)은 마운트 시 항상 0에서 실제 값까지 그려지며
// 등장한다. 이 SVG 버전도 같은 느낌을 내려면 최종 값으로 바로 그려지지 않고, 마운트 이후
// 한 프레임 뒤에 실제 값으로 바뀌면서 트랜지션이 재생되게 해야 한다.
const isFilled = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isFilled.value = true
  })
})

const dashOffset = computed(
  () => CIRCUMFERENCE * (1 - (isFilled.value ? achievementPercent.value : 0) / 100),
)

function isInProgress(card: PerformanceSummaryCardItem): boolean {
  return !card.isCurrentTierAchieved && card.achievementRate > 0
}

const inProgressCount = computed(() => props.summary.cards.filter(isInProgress).length)
const notStartedCount = computed(
  () => props.summary.cardCount - props.summary.achievedCardCount - inProgressCount.value,
)
</script>

<template>
  <div class="rounded-lg bg-accent p-4">
    <div class="grid grid-cols-[minmax(0,35%)_minmax(0,65%)] gap-4">
      <div class="relative mx-auto aspect-square self-stretch">
        <svg viewBox="0 0 100 100" class="size-full -rotate-90">
          <circle cx="50" cy="50" r="42" fill="none" stroke-width="10" class="stroke-divider" />
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke-width="10"
            stroke-linecap="round"
            class="stroke-primary transition-[stroke-dashoffset] duration-400 ease-in-out"
            :stroke-dasharray="CIRCUMFERENCE"
            :stroke-dashoffset="dashOffset"
          />
        </svg>
        <div class="absolute inset-0 flex flex-col items-center justify-center">
          <span class="text-subheading font-bold text-charcoal">{{ achievementPercent }}%</span>
          <span class="text-micro text-gray">금액 기준</span>
        </div>
      </div>

      <div class="flex min-w-0 flex-col justify-center">
        <p class="text-caption text-gray">
          {{ Number(summary.yearMonth.split('-')[1]) }}월 실적 달성
        </p>
        <p class="mt-0.5 text-subheading font-bold text-charcoal">
          카드 {{ summary.cardCount }}장 중
          <span class="text-primary">{{ summary.achievedCardCount }}장</span>
        </p>

        <div class="mt-2 grid min-w-0 grid-cols-3 gap-1">
          <div class="rounded-md bg-success/10 py-2 text-center">
            <p class="text-caption font-bold text-success">{{ summary.achievedCardCount }}</p>
            <p class="text-label text-gray">달성</p>
          </div>
          <div class="rounded-md bg-primary/10 py-2 text-center">
            <p class="text-caption font-bold text-primary">{{ inProgressCount }}</p>
            <p class="text-label text-gray">진행 중</p>
          </div>
          <div class="rounded-md bg-divider py-2 text-center">
            <p class="text-caption font-bold text-gray">{{ notStartedCount }}</p>
            <p class="text-label text-gray">미시작</p>
          </div>
        </div>
      </div>
    </div>

    <template v-if="nearestAchievement">
      <div class="my-3 border-t border-dashed border-divider" />
      <div class="flex items-center justify-between gap-2">
        <p class="text-caption text-gray">가장 가까운 다음 달성</p>
        <p class="text-caption font-bold text-charcoal">
          {{ nearestAchievement.cardName }} ·
          <span class="text-primary">{{
            formatAmountWithUnit(nearestAchievement.remainingAmount)
          }}</span>
        </p>
      </div>
    </template>
  </div>
</template>
