<script setup lang="ts">
import type { RankedCardBenefit } from '@/domains/map/api/merchants'
import { describeRecommendationReason, formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import { formatAmountWithUnit } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

interface Props {
  rankedCards: RankedCardBenefit[]
  // 상세 페이지 전용: 발급사, 미충족 카드 사유 박스까지 보여준다.
  detailed?: boolean
  // 상세 페이지 계산기에서 입력한 결제 금액. 있으면 %/포인트 대신 그 금액 기준 실제 혜택 금액을 보여준다.
  appliedAmount?: number | null
}

withDefaults(defineProps<Props>(), {
  detailed: false,
  appliedAmount: null,
})

function performanceRate(item: RankedCardBenefit): number {
  if (item.requiredPreviousSpendKrw == null || item.requiredPreviousSpendKrw <= 0) return 100
  return Math.min(
    100,
    Math.floor((item.previousMonthSpendKrw / item.requiredPreviousSpendKrw) * 100),
  )
}

// 미충족 카드 밑에 왜 미충족인지 보여줄 첫 번째 미충족 사유.
function unmetReasonText(item: RankedCardBenefit): string | null {
  const reason = item.recommendationReasons.find((candidate) => !candidate.satisfied)
  return reason ? describeRecommendationReason(reason) : null
}
</script>

<template>
  <div v-if="rankedCards.length" class="mt-4">
    <p class="text-subheading text-charcoal">내 카드 혜택 순위</p>

    <div class="mt-2 space-y-3">
      <div v-for="item in rankedCards" :key="item.userCardId">
        <div class="flex items-center gap-3">
          <div class="flex shrink-0 items-center gap-1">
            <span class="text-caption text-primary w-6 shrink-0 font-bold">#{{ item.rank }}</span>
            <CardImage
              :src="item.cardImageUrl"
              :alt="`${item.cardName} 카드 이미지`"
              :width="24"
              :height="38"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <p class="text-caption text-charcoal truncate leading-none">{{ item.cardName }}</p>
            <p v-if="detailed && item.issuerName" class="text-label text-gray truncate">
              {{ item.issuerName }}
            </p>
            <div
              class="bg-divider mt-1.5 h-1 rounded-full"
              role="progressbar"
              :aria-label="`${item.cardName} 실적 달성률`"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="performanceRate(item)"
            >
              <div
                class="bg-primary h-full rounded-full"
                :style="{ width: `${performanceRate(item)}%` }"
              />
            </div>
          </div>

          <div class="flex w-14 shrink-0 justify-center">
            <span
              v-if="!item.performanceMet"
              class="text-label bg-accent text-primary rounded-full px-2 py-0.5 whitespace-nowrap"
            >
              미충족
            </span>
            <span v-else class="text-caption text-charcoal whitespace-nowrap">
              {{
                appliedAmount !== null
                  ? formatAmountWithUnit(item.estimatedValueKrw)
                  : formatRewardLabel(item)
              }}
            </span>
          </div>
        </div>

        <!-- 미충족 카드 밑에 왜 미충족인지 바로 알 수 있게 사유를 눈에 띄는 회색 박스로 붙인다. 상세 페이지에서만 노출. -->
        <p
          v-if="detailed && !item.performanceMet && unmetReasonText(item)"
          class="text-label text-gray bg-screen mt-3 rounded-md p-3"
        >
          {{ unmetReasonText(item) }}
        </p>
      </div>
    </div>
  </div>
</template>
