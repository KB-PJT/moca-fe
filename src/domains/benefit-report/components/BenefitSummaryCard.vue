<script setup lang="ts">
import { computed } from 'vue'
import { Info } from '@lucide/vue'
import {
  BENEFIT_TYPE_COLORS,
  type BenefitSummary,
  type BenefitType,
} from '@/domains/benefit-report/api/benefitReport'
import { formatAmount, formatAmountWithUnit, formatSignedAmount } from '@/shared/utils/format'
import BenefitDonutChart from '@/domains/benefit-report/components/BenefitDonutChart.vue'

const props = defineProps<{
  summary: BenefitSummary
}>()

const donutSize = 96

// 이번 달 실제로 받은 유형이 없어도(0원이어도) 어떤 유형들이 있는지는 항상 보여준다.
const BENEFIT_TYPE_LABELS: Record<BenefitType, string> = {
  DISCOUNT: '할인',
  CASHBACK: '캐시백',
  POINT: '포인트',
}

const displayRows = computed(() => {
  const amountByType = new Map(props.summary.breakdown.map((item) => [item.type, item.amount]))

  return (Object.keys(BENEFIT_TYPE_LABELS) as BenefitType[]).map((type) => ({
    type,
    label: BENEFIT_TYPE_LABELS[type],
    amount: amountByType.get(type) ?? 0,
  }))
})

const comparisonBadgeText = computed(() => {
  const diff = props.summary.differenceAmount

  if (diff === 0) return '지난달과 동일'
  return `지난달보다 ${formatSignedAmount(diff)}`
})
</script>

<template>
  <div class="rounded-lg border border-divider/60 bg-linear-to-br from-card to-accent p-4">
    <div class="flex items-center justify-between gap-2">
      <p class="text-subheading font-bold text-charcoal">이번 달 받은 총혜택</p>
      <span
        class="shrink-0 rounded-full bg-white/70 px-2.5 py-1 text-label"
        :class="summary.differenceAmount < 0 ? 'text-error' : 'text-success'"
      >
        {{ comparisonBadgeText }}
      </span>
    </div>

    <p class="mt-2 flex items-center gap-1">
      <span class="text-display font-bold text-charcoal"
        >{{ formatAmount(summary.totalBenefitAmount) }}원</span
      >
      <Info class="size-3.5 text-gray" />
    </p>

    <div class="mt-3 flex items-center gap-8">
      <BenefitDonutChart :breakdown="summary.breakdown" :size="donutSize" />

      <dl class="flex min-w-0 flex-1 flex-col gap-2">
        <div v-for="row in displayRows" :key="row.type" class="flex items-center gap-2">
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: BENEFIT_TYPE_COLORS[row.type] }"
          />
          <dt class="text-caption font-semibold text-charcoal">{{ row.label }}</dt>
          <dd
            class="ml-auto text-body font-semibold"
            :class="row.amount > 0 ? 'text-charcoal' : 'text-gray'"
          >
            {{ formatAmountWithUnit(row.amount) }}
          </dd>
        </div>
        <div class="flex items-center gap-2">
          <span class="size-2.5 shrink-0 rounded-full bg-divider" />
          <dt class="text-caption font-semibold text-charcoal">마일리지</dt>
          <dd class="ml-auto text-label text-gray">원화 환산 제외</dd>
        </div>
      </dl>
    </div>
  </div>
</template>
