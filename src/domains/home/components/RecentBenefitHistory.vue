<script setup lang="ts">
import { ChevronRight } from '@lucide/vue'
import type { RecentBenefitItem } from '@/domains/home/mocks/recentBenefits'

interface Props {
  items: RecentBenefitItem[]
}

defineProps<Props>()

const currencyFormatter = new Intl.NumberFormat('ko-KR')

function formatAmount(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}
</script>

<template>
  <section class="px-5 pb-4" aria-labelledby="recent-benefit-title">
    <div class="flex items-center justify-between py-4">
      <h2 id="recent-benefit-title" class="text-subheading font-semibold text-charcoal">
        최근 전체 혜택 내역
      </h2>
      <button type="button" class="flex items-center gap-0.5 text-caption font-semibold text-brown">
        전체보기
        <ChevronRight class="size-3" aria-hidden="true" />
      </button>
    </div>

    <ul>
      <li
        v-for="item in items"
        :key="item.id"
        class="flex min-h-16.5 items-center gap-3 border-b border-black/6 px-3.5 py-3.5 last:border-b-0"
      >
        <div class="min-w-0 flex-1">
          <div class="flex items-center gap-1.5">
            <strong class="text-body font-semibold text-charcoal">{{ item.merchantName }}</strong>
            <span class="rounded-full bg-[#FEF3C6] px-1.5 py-0.5 text-micro text-[#973C00]">
              {{ item.benefitType }}
            </span>
          </div>
          <p class="mt-0.5 truncate text-caption font-semibold text-[#8C7F74]">
            {{ item.description }}
            <span class="px-1 text-[#8C7F74]/40" aria-hidden="true">·</span>
            {{ item.cardName }}
          </p>
        </div>

        <div class="shrink-0 text-right">
          <strong class="block text-body font-bold text-brown">
            -{{ formatAmount(item.benefitAmount) }}
          </strong>
          <span class="block text-caption font-semibold text-[#8C7F74]">
            {{ formatAmount(item.paymentAmount) }} 결제
          </span>
        </div>
      </li>
    </ul>
  </section>
</template>
