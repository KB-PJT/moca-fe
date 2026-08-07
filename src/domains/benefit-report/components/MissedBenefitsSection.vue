<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ChevronLeft, ChevronRight, Info } from '@lucide/vue'
import {
  MOCK_MISSED_BENEFIT_CARDS,
  type MissedBenefitCondition,
} from '@/domains/benefit-report/api/benefitReport.mock'
import { formatAmountWithUnit, formatPoint } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

const cardIndex = ref(0)
const rootEl = ref<HTMLElement | null>(null)
const slideDirection = ref<'next' | 'prev'>('next')

// 카드 전환으로 조건 개수가 늘어났는지 미리 기록해뒀다가,
// 새 카드 콘텐츠가 다 나타난 뒤(@after-enter)에 늘어난 만큼 스크롤한다.
const shouldScrollIntoView = ref(false)

watch(cardIndex, (newIndex, oldIndex) => {
  const newCount = MOCK_MISSED_BENEFIT_CARDS[newIndex]?.conditions.length ?? 0
  const oldCount = MOCK_MISSED_BENEFIT_CARDS[oldIndex]?.conditions.length ?? 0
  shouldScrollIntoView.value = newCount > oldCount
})

function handleConditionsAfterEnter() {
  if (!shouldScrollIntoView.value) return
  shouldScrollIntoView.value = false
  rootEl.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

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
  slideDirection.value = 'prev'
  cardIndex.value -= 1
}

function goToNextCard() {
  if (!canGoNextCard.value) return
  slideDirection.value = 'next'
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
  <div ref="rootEl">
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
        <CardImage
          :src="currentCard.cardImageUrl"
          :alt="`${currentCard.cardName} 카드 이미지`"
          orientation="horizontal"
          :width="34"
          :height="22"
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

    <Transition
      :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'"
      mode="out-in"
      @after-enter="handleConditionsAfterEnter"
    >
      <div :key="currentCard.cardId" class="mt-3 space-y-2">
        <div
          v-for="condition in currentCard.conditions"
          :key="condition.label"
          class="rounded-lg border border-divider bg-card p-3 shadow-card"
        >
          <div class="flex items-center justify-between">
            <span class="text-body font-bold text-charcoal">{{ condition.label }}</span>
            <span class="text-body font-bold text-charcoal"
              >남은 {{ remainingText(condition) }}</span
            >
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
    </Transition>
  </div>
</template>

<style scoped>
.slide-next-enter-active,
.slide-next-leave-active,
.slide-prev-enter-active,
.slide-prev-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

/* 다음으로 갈 때: 나가는 카드는 왼쪽으로, 들어오는 카드는 오른쪽에서 */
.slide-next-leave-to {
  opacity: 0;
  transform: translateX(-16px);
}
.slide-next-enter-from {
  opacity: 0;
  transform: translateX(16px);
}

/* 이전으로 갈 때: 나가는 카드는 오른쪽으로, 들어오는 카드는 왼쪽에서 */
.slide-prev-leave-to {
  opacity: 0;
  transform: translateX(16px);
}
.slide-prev-enter-from {
  opacity: 0;
  transform: translateX(-16px);
}

@media (prefers-reduced-motion: reduce) {
  .slide-next-enter-active,
  .slide-next-leave-active,
  .slide-prev-enter-active,
  .slide-prev-leave-active {
    transition: none !important;
  }
}
</style>
