<script setup lang="ts">
import { computed } from 'vue'
import { CircleCheck, CircleDashed, Target, TrendingUp } from '@lucide/vue'
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
        {{ Number(summary.yearMonth.split('-')[1]) }}월 실적 현황
      </p>
      <span class="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-label text-gray">
        보유 카드 {{ summary.cardCount }}장
      </span>
    </div>

    <p class="mt-2 text-heading font-bold text-charcoal">
      <template v-if="inProgressCount > 0">
        <span class="text-primary">{{ inProgressCount }}장</span>의 카드에 실적이 더 필요해요
      </template>
      <template v-else>이번 달 카드 실적을 잘 챙기고 있어요</template>
    </p>
    <p class="mt-1 text-caption text-gray">달성한 카드는 추가 실적을 신경 쓰지 않아도 돼요.</p>

    <div class="mt-3 grid min-w-0 grid-cols-3 gap-1.5">
      <div class="flex flex-col items-center gap-1 rounded-md bg-success/10 py-3">
        <CircleCheck class="size-4 text-success" />
        <p class="text-heading font-bold text-success">{{ summary.achievedCardCount }}장</p>
        <p class="text-caption font-bold text-success">충분해요</p>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-md bg-primary/10 py-3">
        <TrendingUp class="size-4 text-primary" />
        <p class="text-heading font-bold text-primary">{{ inProgressCount }}장</p>
        <p class="text-caption font-bold text-primary">더 채워야 해요</p>
      </div>
      <div class="flex flex-col items-center gap-1 rounded-md bg-[#8C7F74]/10 py-3">
        <CircleDashed class="size-4 text-[#8C7F74]" />
        <p class="text-heading font-bold text-[#8C7F74]">{{ notStartedCount }}장</p>
        <p class="text-caption font-bold text-[#8C7F74]">미사용</p>
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
