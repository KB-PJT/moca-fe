<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleDashed, Target, TrendingUp } from '@lucide/vue'
import type {
  PerformanceSummary,
  PerformanceSummaryCardItem,
} from '@/domains/benefit-report/api/performanceReport'
import { formatAmount, formatAmountWithUnit } from '@/shared/utils/format'
import Skeleton from '@/shared/ui/skeleton/Skeleton.vue'

interface NearestAchievement {
  cardName: string
  remainingAmount: number
}

const props = defineProps<{
  summary: PerformanceSummary
  // 카드별 실적 목록(다른 API 응답)에서 합산해 넘겨받는 이번 달 실적 총액. 두 API가 다
  // 응답해야 채워지므로 아직 없을 수 있어 optional(그동안 스켈레톤을 보여준다).
  totalPerformanceAmount?: number | null
  // 카드별 실적 목록(다른 API 응답)에서 계산해 넘겨받는, 미달성 카드 중 남은 금액이
  // 가장 적은 카드. 두 API가 다 응답해야 채워지므로 아직 없을 수 있어 optional.
  nearestAchievement?: NearestAchievement | null
}>()

function isInProgress(card: PerformanceSummaryCardItem): boolean {
  return !card.isCurrentTierAchieved && card.achievementRate > 0
}

const inProgressCount = computed(() => props.summary.cards.filter(isInProgress).length)
const notStartedCount = computed(
  () => props.summary.cardCount - props.summary.achievedCardCount - inProgressCount.value,
)
</script>

<template>
  <div class="rounded-lg border border-divider/60 bg-linear-to-br from-card to-accent p-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-subheading font-bold text-charcoal">
        {{ Number(summary.yearMonth.split('-')[1]) }}월 실적 금액
      </p>
      <span class="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-label text-gray">
        보유 카드 {{ summary.cardCount }}장
      </span>
    </div>
    <div class="mt-1 flex items-baseline gap-1">
      <Skeleton v-if="totalPerformanceAmount == null" class="h-8 w-32" />
      <span v-else class="text-display font-bold text-primary">{{
        formatAmount(totalPerformanceAmount)
      }}</span>
      <span v-if="totalPerformanceAmount != null" class="text-caption font-semibold text-gray"
        >원</span
      >
    </div>

    <div class="mt-3 grid min-w-0 grid-cols-3 gap-1.5">
      <div class="flex flex-col items-center gap-1 rounded-md bg-success/10 py-2.5">
        <CircleCheck class="size-4 text-success" />
        <p class="text-subheading font-bold text-success">{{ summary.achievedCardCount }}</p>
        <p class="text-caption font-semibold text-gray">달성</p>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-md bg-primary/10 py-2.5">
        <TrendingUp class="size-4 text-primary" />
        <p class="text-subheading font-bold text-primary">{{ inProgressCount }}</p>
        <p class="text-caption font-semibold text-gray">진행 중</p>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-md bg-[#8C7F74]/10 py-2.5">
        <CircleDashed class="size-4 text-[#8C7F74]" />
        <p class="text-subheading font-bold text-[#8C7F74]">{{ notStartedCount }}</p>
        <p class="text-caption font-semibold text-gray">미사용</p>
      </div>
    </div>

    <template v-if="nearestAchievement">
      <div class="my-3 border-t border-dashed border-divider" />
      <div class="flex items-center gap-2">
        <p class="flex shrink-0 items-center gap-1 text-caption whitespace-nowrap text-gray">
          <Target class="size-3.5 text-primary" />
          가장 가까운 다음 달성
        </p>
        <p
          class="flex min-w-0 flex-1 items-center justify-end gap-1 text-caption font-bold text-charcoal"
        >
          <span class="truncate">{{ nearestAchievement.cardName }}</span>
          <span class="shrink-0 whitespace-nowrap">
            ·
            <span class="text-primary">{{
              formatAmountWithUnit(nearestAchievement.remainingAmount)
            }}</span>
          </span>
        </p>
      </div>
    </template>
  </div>
</template>
