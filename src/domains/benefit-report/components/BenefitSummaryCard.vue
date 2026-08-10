<script setup lang="ts">
import { computed } from 'vue'
import { Info } from '@lucide/vue'
import {
  BENEFIT_TYPE_COLORS,
  type MonthlyBenefitSummary,
} from '@/domains/benefit-report/api/benefitReport.mock'
import { formatAmount, formatAmountWithUnit } from '@/shared/utils/format'
import BenefitDonutChart from '@/domains/benefit-report/components/BenefitDonutChart.vue'

const props = defineProps<{
  summary: MonthlyBenefitSummary
  previousTotalAmount: number | null
}>()

const donutSize = 120

const comparisonText = computed(() => {
  if (props.previousTotalAmount == null) return null

  const diff = props.summary.totalAmount - props.previousTotalAmount

  if (diff > 0) return `지난달보다 ${formatAmountWithUnit(diff)} 더 받았어요 ↑`
  if (diff < 0) return `지난달보다 ${formatAmountWithUnit(Math.abs(diff))} 덜 받았어요 ↓`
  return '지난달과 동일해요'
})
</script>

<template>
  <div class="rounded-lg bg-accent p-4">
    <p class="text-caption text-gray">이번 달 받은 총혜택</p>
    <p class="mt-1 flex items-center gap-1">
      <span class="text-display text-charcoal">{{ formatAmount(summary.totalAmount) }}원</span>
      <Info class="size-3.5 text-gray" />
    </p>
    <p v-if="comparisonText" class="mt-1 text-caption font-semibold text-success">
      {{ comparisonText }}
    </p>

    <div class="mt-3 flex items-center gap-10">
      <BenefitDonutChart :breakdown="summary.breakdown" :size="donutSize" />

      <dl class="flex flex-1 flex-col space-y-2">
        <div v-for="item in summary.breakdown" :key="item.type" class="flex items-center gap-2">
          <span
            class="size-2.5 shrink-0 rounded-full"
            :style="{ backgroundColor: BENEFIT_TYPE_COLORS[item.type] }"
          />
          <dt class="text-caption font-semibold text-charcoal">{{ item.label }}</dt>
          <dd class="ml-auto text-body font-semibold text-charcoal">
            {{ formatAmountWithUnit(item.amount) }}
          </dd>
        </div>
      </dl>
    </div>
  </div>
</template>
