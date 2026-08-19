<script setup lang="ts">
import type { HomeOwnedCard } from '@/domains/home/api/homeCards'

interface Props {
  card: HomeOwnedCard
}

defineProps<Props>()

const currencyFormatter = new Intl.NumberFormat('ko-KR')

function formatAmount(amount: number) {
  return `${currencyFormatter.format(amount)}원`
}
</script>

<template>
  <dl data-card-benefit-amounts class="grid min-h-20 grid-cols-2 border-b border-divider">
    <div class="flex flex-col justify-center border-r border-divider px-5">
      <dt class="text-caption text-gray">이번 달 받은 혜택</dt>
      <dd class="mt-0.5">
        <RouterLink
          :to="{ name: 'home-benefits', query: { userCardId: card.id } }"
          :aria-label="`이번 달 받은 혜택 ${formatAmount(card.receivedBenefitAmount)} 최근 혜택 내역 보기`"
          data-received-benefit
          class="inline-block rounded-sm text-heading text-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
        >
          {{ formatAmount(card.receivedBenefitAmount) }}
        </RouterLink>
      </dd>
      <p class="text-caption text-gray">상당</p>
    </div>

    <div class="flex flex-col justify-center px-5">
      <dt class="text-caption text-gray">더 받을 수 있는 금액</dt>
      <dd class="mt-0.5">
        <RouterLink
          :to="{ name: 'report' }"
          :aria-label="`더 받을 수 있는 금액 ${formatAmount(card.availableBenefitAmount)} 혜택 리포트 보기`"
          data-available-benefit
          class="inline-block rounded-sm text-heading text-charcoal focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-charcoal"
        >
          {{ formatAmount(card.availableBenefitAmount) }}
        </RouterLink>
      </dd>
      <p class="text-caption text-gray">추가 혜택 가능</p>
    </div>
  </dl>
</template>
