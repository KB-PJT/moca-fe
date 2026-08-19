<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import {
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Info,
  LoaderCircle,
  TriangleAlert,
} from '@lucide/vue'
import {
  fetchMissedBenefits,
  type MissedBenefitItem,
} from '@/domains/benefit-report/api/benefitReport'
import { fetchMyCards } from '@/domains/card/api/cardManagement'
import { formatAmountWithUnit } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

const props = defineProps<{
  yearMonth: string
}>()

const cardIndex = ref(0)
const rootEl = ref<HTMLElement | null>(null)
const slideDirection = ref<'next' | 'prev'>('next')

const {
  data: ownedCardsResult,
  isPending: isOwnedCardsPending,
  isError: isOwnedCardsError,
  refetch: refetchOwnedCards,
} = useQuery({
  queryKey: ['cards', 'my-cards'],
  queryFn: fetchMyCards,
})

const ownedCards = computed(() => ownedCardsResult.value?.activeCards ?? [])
const currentCard = computed(() => ownedCards.value[cardIndex.value] ?? null)

const canGoPrevCard = computed(() => cardIndex.value > 0)
const canGoNextCard = computed(() => cardIndex.value < ownedCards.value.length - 1)

const {
  data: missedReport,
  isPending: isMissedPending,
  isError: isMissedError,
  refetch: refetchMissed,
} = useQuery({
  queryKey: computed(() => [
    'benefit-report',
    'missed',
    currentCard.value?.userCardId,
    props.yearMonth,
  ]),
  queryFn: () =>
    fetchMissedBenefits({
      userCardId: currentCard.value!.userCardId,
      yearMonth: props.yearMonth,
    }),
  enabled: computed(() => Boolean(currentCard.value)),
})

const benefits = computed(() => missedReport.value?.benefits ?? [])
const totalMissedAmount = computed(() => missedReport.value?.totalMissedBenefitAmount ?? 0)

// 카드 전환으로 놓친 혜택 개수가 늘어났는지 기록해뒀다가,
// 새 카드 콘텐츠가 다 나타난 뒤(@after-enter)에 늘어난 만큼 스크롤한다.
const shouldScrollIntoView = ref(false)
const previousBenefitsCount = ref<number | null>(null)

watch(
  () => missedReport.value?.benefits.length,
  (newCount) => {
    if (newCount === undefined) return
    if (previousBenefitsCount.value !== null && newCount > previousBenefitsCount.value) {
      shouldScrollIntoView.value = true
    }
    previousBenefitsCount.value = newCount
  },
)

function handleConditionsAfterEnter() {
  if (!shouldScrollIntoView.value) return
  shouldScrollIntoView.value = false
  rootEl.value?.scrollIntoView({ behavior: 'smooth', block: 'end' })
}

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

function remainingText(item: MissedBenefitItem) {
  return formatAmountWithUnit(item.remainingAmount)
}

function progressText(item: MissedBenefitItem) {
  return `${formatAmountWithUnit(item.usedAmount)} / ${formatAmountWithUnit(item.limitAmount)} 사용`
}

function progressPercent(item: MissedBenefitItem) {
  if (item.limitAmount <= 0) return 0
  return Math.min(100, Math.floor((item.usedAmount / item.limitAmount) * 100))
}
</script>

<template>
  <div ref="rootEl">
    <p class="flex items-center gap-1.5">
      <span class="text-subheading font-bold text-charcoal">이번 달 놓치고 있는 혜택</span>
      <span v-if="missedReport" class="text-body font-bold text-primary">
        {{ formatAmountWithUnit(totalMissedAmount) }} 상당
      </span>
    </p>

    <div
      v-if="isOwnedCardsPending"
      class="mt-3 flex items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8"
    >
      <LoaderCircle class="text-primary size-5 animate-spin" />
      <p class="text-caption text-gray">카드 정보를 불러오는 중...</p>
    </div>

    <div
      v-else-if="isOwnedCardsError"
      class="mt-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8 text-center"
    >
      <TriangleAlert class="size-6 text-gray" />
      <p class="text-caption text-gray">카드 정보를 불러오지 못했어요.</p>
      <button
        type="button"
        class="text-caption font-semibold text-primary"
        @click="() => refetchOwnedCards()"
      >
        다시 시도
      </button>
    </div>

    <div
      v-else-if="!currentCard"
      class="mt-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8 text-center"
    >
      <CreditCard class="size-6 text-gray" />
      <p class="text-caption text-gray">등록된 카드가 없어요.</p>
    </div>

    <template v-else>
      <div
        class="mt-3 flex items-center justify-between rounded-full border border-divider bg-card p-1.5"
      >
        <button
          type="button"
          aria-label="이전 카드"
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
          aria-label="다음 카드"
          class="flex size-7 shrink-0 items-center justify-center text-gray disabled:opacity-30"
          :disabled="!canGoNextCard"
          @click="goToNextCard"
        >
          <ChevronRight class="size-4" />
        </button>
      </div>

      <div
        v-if="isMissedPending"
        class="mt-3 flex items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8"
      >
        <LoaderCircle class="text-primary size-5 animate-spin" />
      </div>

      <div
        v-else-if="isMissedError"
        class="mt-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8 text-center"
      >
        <TriangleAlert class="size-6 text-gray" />
        <p class="text-caption text-gray">놓친 혜택 정보를 불러오지 못했어요.</p>
        <button
          type="button"
          class="text-caption font-semibold text-primary"
          @click="() => refetchMissed()"
        >
          다시 시도
        </button>
      </div>

      <div
        v-else-if="benefits.length === 0"
        class="mt-3 flex flex-col items-center justify-center gap-2 rounded-lg border border-divider bg-card py-8 text-center"
      >
        <Info class="size-6 text-disabled" />
        <p class="text-caption text-gray">이 카드는 이번 달 놓친 혜택이 없어요.</p>
      </div>

      <Transition
        v-else
        :name="slideDirection === 'next' ? 'slide-next' : 'slide-prev'"
        mode="out-in"
        @after-enter="handleConditionsAfterEnter"
      >
        <div :key="currentCard.userCardId" class="mt-3 space-y-2">
          <div
            v-for="item in benefits"
            :key="item.benefitRuleId"
            class="rounded-lg border border-divider bg-card p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-body font-bold text-charcoal">{{ item.title }}</span>
              <span class="text-body font-bold text-charcoal">남은 {{ remainingText(item) }}</span>
            </div>

            <div class="mt-2 h-1.5 overflow-hidden rounded-full bg-divider">
              <div
                class="h-full rounded-full bg-primary transition-[width] duration-300 ease-out"
                :style="{ width: `${progressPercent(item)}%` }"
              />
            </div>

            <p class="mt-1.5 text-caption text-gray">{{ progressText(item) }}</p>
          </div>
        </div>
      </Transition>
    </template>
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
