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
  <dl class="grid min-h-24 grid-cols-2 border-b border-divider">
    <div class="flex flex-col justify-center border-r border-divider px-5">
      <dt class="text-caption text-gray">이번 달 받은 혜택</dt>
      <dd data-received-benefit class="mt-1 text-title text-primary">
        {{ formatAmount(card.receivedBenefitAmount) }}
      </dd>
      <p class="text-caption text-gray">상당</p>
    </div>

    <div class="flex flex-col justify-center px-5">
      <dt class="text-caption text-gray">더 받을 수 있는 금액</dt>
      <dd data-available-benefit class="mt-1 text-title text-charcoal underline underline-offset-2">
        {{ formatAmount(card.availableBenefitAmount) }}
      </dd>
      <p class="text-caption text-gray">추가 혜택 가능</p>
    </div>
  </dl>
</template>
