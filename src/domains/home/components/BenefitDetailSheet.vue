<script setup lang="ts">
import { computed } from 'vue'
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import { Sheet, SheetContent, SheetDescription, SheetTitle } from '@/shared/ui/sheet'

const props = defineProps<{ item: RecentBenefitItem | null }>()
const open = defineModel<boolean>('open', { default: false })
const currencyFormatter = new Intl.NumberFormat('ko-KR')

const monthlyProgressRate = computed(() => {
  if (!props.item || props.item.monthlyBenefitLimit <= 0) return 0
  return Math.min(
    Math.round((props.item.monthlyBenefitUsed / props.item.monthlyBenefitLimit) * 100),
    100,
  )
})
const remainingBenefitAmount = computed(() =>
  props.item ? Math.max(props.item.monthlyBenefitLimit - props.item.monthlyBenefitUsed, 0) : 0,
)
const isUnappliedBenefit = computed(
  () =>
    props.item?.calculationStatus === 'NOT_APPLIED' ||
    props.item?.calculationStatus === 'NOT_CALCULATED',
)
const hasMissedBenefit = computed(
  () => isUnappliedBenefit.value && Boolean(props.item?.missedBenefitAmount),
)

function formatAmount(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}

function formatBenefitAmount(item: RecentBenefitItem) {
  const prefix = item.benefitType === '할인' ? '-' : ''
  return `${prefix}${formatAmount(item.benefitAmount)}`
}
</script>

<template>
  <Sheet v-model:open="open">
    <SheetContent
      side="bottom"
      class="mx-auto w-full gap-0 rounded-t-lg border-0 px-5 pt-4 pb-[max(2.5rem,var(--safe-area-bottom))] sm:max-w-[430px]"
    >
      <div class="mx-auto h-1 w-10 rounded-full bg-divider" aria-hidden="true" />

      <div class="pt-5 pb-4">
        <SheetTitle class="text-heading font-bold text-charcoal">내역 상세</SheetTitle>
        <SheetDescription class="sr-only">선택한 카드 승인 내역의 상세 정보</SheetDescription>
      </div>

      <template v-if="item">
        <section class="min-h-18.5 rounded-md bg-screen px-4 py-3.5">
          <div>
            <p class="text-caption text-[#8C7F74]">{{ item.occurredAt }}</p>
            <strong class="mt-1 block text-subheading font-semibold text-charcoal">
              {{ item.merchantName }}
            </strong>
          </div>
        </section>

        <dl class="mt-5 divide-y divide-divider">
          <div class="flex items-center justify-between py-3">
            <dt class="shrink-0 text-body text-[#8C7F74]">사용 카드</dt>
            <dd class="min-w-0 flex-1 text-right text-body font-normal break-keep text-charcoal">
              {{ item.cardName }}
              <template v-if="item.cardLastFour">•••• {{ item.cardLastFour }}</template>
            </dd>
          </div>
          <div class="flex items-center justify-between py-3">
            <dt class="text-body text-[#8C7F74]">결제금액</dt>
            <dd class="text-body font-normal text-charcoal">
              {{ formatAmount(item.paymentAmount) }}
            </dd>
          </div>
          <div v-if="hasMissedBenefit" class="flex items-center justify-between py-3">
            <dt class="text-body text-[#8C7F74]">놓친 혜택</dt>
            <dd class="text-body font-normal text-primary">
              {{ formatAmount(item.missedBenefitAmount) }} {{ item.benefitType }}
            </dd>
          </div>
          <div
            v-else-if="item.benefitType && !isUnappliedBenefit"
            class="flex items-center justify-between py-3"
          >
            <dt class="text-body text-[#8C7F74]">받은 혜택</dt>
            <dd class="text-body font-normal text-benefit">
              {{ formatBenefitAmount(item) }} {{ item.benefitType }}
            </dd>
          </div>
          <div
            v-if="item.benefitType && !isUnappliedBenefit"
            class="flex items-center justify-between py-3"
          >
            <dt class="text-body text-[#8C7F74]">
              {{ hasMissedBenefit ? '놓친 혜택 정보' : '적용 혜택' }}
            </dt>
            <dd class="text-body font-normal text-charcoal">{{ item.description }}</dd>
          </div>
          <template v-if="hasMissedBenefit && item.performanceShortfall">
            <div class="flex items-center justify-between py-3">
              <dt class="text-body text-[#8C7F74]">전월 실적</dt>
              <dd class="text-body font-normal text-charcoal">
                {{ formatAmount(item.performanceShortfall.achievedAmount) }}
              </dd>
            </div>
            <div class="flex items-center justify-between py-3">
              <dt class="text-body text-[#8C7F74]">필요 실적</dt>
              <dd class="text-body font-normal text-charcoal">
                {{ formatAmount(item.performanceShortfall.requiredAmount) }}
              </dd>
            </div>
            <div class="flex items-center justify-between py-3">
              <dt class="text-body text-[#8C7F74]">부족 실적</dt>
              <dd class="text-body font-normal text-primary">
                {{ formatAmount(item.performanceShortfall.remainingAmount) }}
              </dd>
            </div>
          </template>
        </dl>

        <section
          v-if="item.benefitType && !isUnappliedBenefit"
          class="mt-4"
          aria-labelledby="monthly-benefit-status-title"
        >
          <div class="flex items-center justify-between">
            <h3 id="monthly-benefit-status-title" class="text-caption font-normal text-charcoal">
              월 혜택 사용 현황
            </h3>
            <p class="text-caption text-[#8C7F74]">
              {{ currencyFormatter.format(item.monthlyBenefitUsed) }} /
              {{ formatAmount(item.monthlyBenefitLimit) }}
            </p>
          </div>
          <div
            class="mt-1.5 h-2 overflow-hidden rounded-full bg-divider"
            role="progressbar"
            aria-label="월 혜택 사용률"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="monthlyProgressRate"
          >
            <div
              class="h-full rounded-full bg-primary"
              :style="{ width: `${monthlyProgressRate}%` }"
            />
          </div>
          <p class="mt-2 text-caption text-[#8C7F74]">
            이번 혜택 적용 후 남은 한도
            <strong class="font-normal text-charcoal">
              {{ formatAmount(remainingBenefitAmount) }}
            </strong>
          </p>
        </section>
      </template>
    </SheetContent>
  </Sheet>
</template>
