<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight, Info } from '@lucide/vue'
import {
  MOCK_MISSED_BENEFIT_CARDS,
  type MissedBenefitCondition,
} from '@/domains/benefit-report/api/benefitReport.mock'
import { formatAmountWithUnit, formatPoint } from '@/shared/utils/format'

const cardIndex = ref(0)

const canGoPrevCard = computed(() => cardIndex.value > 0)
const canGoNextCard = computed(() => cardIndex.value < MOCK_MISSED_BENEFIT_CARDS.length - 1)

const currentCard = computed(() => MOCK_MISSED_BENEFIT_CARDS[cardIndex.value]!)

const totalMissedAmount = computed(() =>
  currentCard.value.conditions.reduce(
    (sum, condition) => sum + (condition.targetAmount - condition.currentAmount),
    0,
  ),
)

function goToPrevCard() {
  if (!canGoPrevCard.value) return
  cardIndex.value -= 1
}

function goToNextCard() {
  if (!canGoNextCard.value) return
  cardIndex.value += 1
}

function formatByUnit(condition: MissedBenefitCondition, amount: number) {
  return condition.unit === 'point' ? formatPoint(amount) : formatAmountWithUnit(amount)
}

function remainingText(condition: MissedBenefitCondition) {
  return formatByUnit(condition, condition.targetAmount - condition.currentAmount)
}

function progressText(condition: MissedBenefitCondition) {
  return `${formatByUnit(condition, condition.currentAmount)} / ${formatByUnit(condition, condition.targetAmount)} 사용`
}

function progressPercent(condition: MissedBenefitCondition) {
  if (condition.targetAmount <= 0) return 0
  return Math.min(100, Math.floor((condition.currentAmount / condition.targetAmount) * 100))
}
</script>

<template>
  <div>
    <p class="flex items-center gap-1.5">
      <span class="text-subheading font-bold text-charcoal">이번 달 놓치고 있는 혜택</span>
      <span class="text-body font-bold text-primary">
        {{ formatAmountWithUnit(totalMissedAmount) }} 상당
      </span>
      <Info class="size-3.5 text-gray" />
    </p>

    <div
      class="mt-3 flex items-center justify-between rounded-full border border-divider bg-card p-1.5"
    >
      <button
        type="button"
        class="flex size-7 shrink-0 items-center justify-center text-gray disabled:opacity-30"
        :disabled="!canGoPrevCard"
        @click="goToPrevCard"
      >
        <ChevronLeft class="size-4" />
      </button>

      <div class="flex items-center gap-2">
        <span
          class="size-6 shrink-0 rounded-full"
          :style="{ backgroundColor: currentCard.accentColor }"
        />
        <span class="text-caption font-semibold text-charcoal">{{ currentCard.cardName }}</span>
      </div>

      <button
        type="button"
        class="flex size-7 shrink-0 items-center justify-center text-gray disabled:opacity-30"
        :disabled="!canGoNextCard"
        @click="goToNextCard"
      >
        <ChevronRight class="size-4" />
      </button>
    </div>

    <div class="mt-3 space-y-2">
      <div
        v-for="condition in currentCard.conditions"
        :key="condition.label"
        class="rounded-lg border border-divider bg-card p-3 shadow-card"
      >
        <div class="flex items-center justify-between">
          <span class="text-body font-bold text-charcoal">{{ condition.label }}</span>
          <span class="text-body font-bold text-charcoal">남은 {{ remainingText(condition) }}</span>
        </div>

        <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
          <div
            class="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
            :style="{ width: `${progressPercent(condition)}%` }"
          />
        </div>

        <p class="mt-1.5 text-caption text-gray">{{ progressText(condition) }}</p>
      </div>
    </div>
  </div>
</template>
