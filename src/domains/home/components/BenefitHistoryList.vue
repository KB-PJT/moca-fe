<script setup lang="ts">
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'

withDefaults(
  defineProps<{
    items: RecentBenefitItem[]
    variant?: 'compact' | 'history'
  }>(),
  { variant: 'compact' },
)

const emit = defineEmits<{
  select: [item: RecentBenefitItem]
}>()

const currencyFormatter = new Intl.NumberFormat('ko-KR')

function formatAmount(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}

function hasMissedBenefit(item: RecentBenefitItem) {
  return isUnappliedBenefit(item) && item.missedBenefitAmount > 0
}

function isUnappliedBenefit(item: RecentBenefitItem) {
  return item.calculationStatus === 'NOT_APPLIED' || item.calculationStatus === 'NOT_CALCULATED'
}

function formatBenefitAmount(item: RecentBenefitItem) {
  const prefix = item.benefitType === '할인' ? '-' : ''
  return `${prefix}${formatAmount(item.benefitAmount)}`
}
</script>

<template>
  <ul>
    <li
      v-for="item in items"
      :key="item.id"
      :class="variant === 'compact' && 'border-b border-black/6 last:border-b-0'"
    >
      <button
        v-if="variant === 'history'"
        type="button"
        class="flex min-h-18 w-full items-center gap-4 px-1 py-3 text-left"
        :aria-label="`${item.merchantName} 내역 상세 보기`"
        @click="emit('select', item)"
      >
        <span
          class="size-2.5 shrink-0 rounded-full"
          :class="{
            'bg-[#E8A54F]': item.benefitType === '할인' && !isUnappliedBenefit(item),
            'bg-[#75B27D]': item.benefitType === '캐시백' && !isUnappliedBenefit(item),
            'bg-brown': item.benefitType === '포인트' && !isUnappliedBenefit(item),
            'bg-[#4B9CC6]': item.benefitType === '마일리지' && !isUnappliedBenefit(item),
            'bg-gray': !item.benefitType || isUnappliedBenefit(item),
          }"
          aria-hidden="true"
        />

        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5">
            <strong class="text-body font-normal text-charcoal">{{ item.merchantName }}</strong>
            <span
              v-if="item.benefitType && !isUnappliedBenefit(item)"
              class="rounded-full px-1.5 py-0.5 text-micro font-normal"
              :class="{
                'bg-[#FCF6F0] text-[#DC933C]': item.benefitType === '할인',
                'bg-[#F1F8F3] text-benefit': item.benefitType === '캐시백',
                'bg-[#F8F3EF] text-brown': item.benefitType === '포인트',
                'bg-[#EDF7FC] text-[#4B9CC6]': item.benefitType === '마일리지',
              }"
            >
              {{ item.benefitType }}
            </span>
          </span>
          <span class="mt-1 block truncate text-caption font-normal text-gray">
            {{ isUnappliedBenefit(item) ? '일반 결제' : item.description }}
          </span>
        </span>

        <span class="shrink-0 text-right">
          <strong
            class="block"
            :class="{
              'text-body font-normal text-benefit': item.benefitType && !isUnappliedBenefit(item),
              'text-caption font-normal text-primary': hasMissedBenefit(item),
              'text-caption font-normal text-gray':
                !item.benefitType || (isUnappliedBenefit(item) && !hasMissedBenefit(item)),
            }"
          >
            <template v-if="hasMissedBenefit(item)">
              놓친 혜택 {{ formatAmount(item.missedBenefitAmount) }}
            </template>
            <template v-else-if="item.benefitType && !isUnappliedBenefit(item)">
              {{ formatBenefitAmount(item) }}
            </template>
            <template v-else>혜택 없음</template>
          </strong>
          <span class="mt-1 block text-caption font-normal text-charcoal">
            {{ formatAmount(item.paymentAmount) }}
          </span>
        </span>
      </button>

      <button
        v-else
        type="button"
        class="flex min-h-16.5 w-full items-center gap-3 py-3.5 text-left"
        :aria-label="`${item.merchantName} 내역 상세 보기`"
        @click="emit('select', item)"
      >
        <span class="min-w-0 flex-1">
          <span class="flex items-center gap-1.5">
            <strong class="text-body font-normal text-charcoal">{{ item.merchantName }}</strong>
            <span
              v-if="item.benefitType && !isUnappliedBenefit(item)"
              class="rounded-full bg-[#FEF3C6] px-1.5 py-0.5 text-micro text-[#973C00]"
            >
              {{ item.benefitType }}
            </span>
          </span>
          <span class="mt-0.5 block truncate text-caption font-normal text-[#8C7F74]">
            {{ isUnappliedBenefit(item) ? '일반 결제' : item.description }}
            <span class="px-1 text-[#8C7F74]/40" aria-hidden="true">·</span>
            {{ item.cardName }}
          </span>
        </span>

        <span class="shrink-0 text-right">
          <strong v-if="hasMissedBenefit(item)" class="block text-caption font-normal text-primary">
            놓친 혜택 {{ formatAmount(item.missedBenefitAmount) }}
          </strong>
          <strong
            v-else-if="item.benefitType && !isUnappliedBenefit(item)"
            class="block text-body font-normal text-benefit"
          >
            {{ formatBenefitAmount(item) }}
          </strong>
          <strong v-else class="block text-caption font-normal text-gray">혜택 없음</strong>
          <span class="block text-caption font-normal text-charcoal">
            {{ formatAmount(item.paymentAmount) }}
          </span>
        </span>
      </button>
    </li>
  </ul>
</template>
