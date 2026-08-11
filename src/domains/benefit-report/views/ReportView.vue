<script setup lang="ts">
import { computed, ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { ChevronLeft, ChevronRight, LoaderCircle } from '@lucide/vue'
import {
  fetchBenefitCategories,
  fetchBenefitSummary,
} from '@/domains/benefit-report/api/benefitReport'
import { MOCK_CARD_PERFORMANCES } from '@/domains/benefit-report/api/cardPerformance.mock'
import PageLayout from '@/shared/components/PageLayout.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import BenefitSummaryCard from '@/domains/benefit-report/components/BenefitSummaryCard.vue'
import CategoryTop3List from '@/domains/benefit-report/components/CategoryTop3List.vue'
import MissedBenefitsSection from '@/domains/benefit-report/components/MissedBenefitsSection.vue'
import CardPerformanceSummary from '@/domains/benefit-report/components/CardPerformanceSummary.vue'
import CardPerformanceList from '@/domains/benefit-report/components/CardPerformanceList.vue'

function currentYearMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function shiftYearMonth(yearMonth: string, delta: number): string {
  const [year, month] = yearMonth.split('-').map(Number)
  const date = new Date(year!, month! - 1 + delta, 1)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

const activeTab = ref<'benefit' | 'performance'>('benefit')
const activeYearMonth = ref(currentYearMonth())

const pageTitle = computed(() => (activeTab.value === 'benefit' ? '혜택 리포트' : '실적 리포트'))

const canGoNextMonth = computed(() => activeYearMonth.value < currentYearMonth())

const monthLabel = computed(() => {
  const [year, month] = activeYearMonth.value.split('-')
  return `${year}년 ${Number(month)}월`
})

function goToPrevMonth() {
  activeYearMonth.value = shiftYearMonth(activeYearMonth.value, -1)
}

function goToNextMonth() {
  if (!canGoNextMonth.value) return
  activeYearMonth.value = shiftYearMonth(activeYearMonth.value, 1)
}

const isBenefitTabActive = computed(() => activeTab.value === 'benefit')

const {
  data: benefitSummary,
  isPending: isSummaryPending,
  isError: isSummaryError,
  refetch: refetchSummary,
} = useQuery({
  queryKey: computed(() => ['benefit-report', 'summary', activeYearMonth.value]),
  queryFn: () => fetchBenefitSummary(activeYearMonth.value),
  enabled: isBenefitTabActive,
})

const {
  data: benefitCategories,
  isPending: isCategoriesPending,
  isError: isCategoriesError,
  refetch: refetchCategories,
} = useQuery({
  queryKey: computed(() => ['benefit-report', 'categories', activeYearMonth.value]),
  queryFn: () => fetchBenefitCategories({ yearMonth: activeYearMonth.value, limit: 3 }),
  enabled: isBenefitTabActive,
})
</script>

<template>
  <PageLayout hide-app-bar has-bottom-bar hide-scrollbar>
    <MainHeader>
      <div class="flex w-full items-center justify-between">
        <div>
          <h1 class="text-heading text-charcoal">{{ pageTitle }}</h1>
          <p class="text-caption text-gray">매일 AM 02:00 동기화</p>
        </div>

        <div class="flex items-center gap-1.5">
          <button type="button" aria-label="이전 달" class="text-gray" @click="goToPrevMonth">
            <ChevronLeft class="size-4" />
          </button>
          <span class="text-body font-semibold text-primary">{{ monthLabel }}</span>
          <button
            type="button"
            aria-label="다음 달"
            class="text-gray disabled:opacity-30"
            :disabled="!canGoNextMonth"
            @click="goToNextMonth"
          >
            <ChevronRight class="size-4" />
          </button>
        </div>
      </div>
    </MainHeader>

    <div class="mt-4 flex items-center rounded-full bg-divider p-1">
      <button
        type="button"
        class="flex-1 rounded-full py-2 text-caption font-semibold"
        :class="activeTab === 'benefit' ? 'bg-white text-primary' : 'text-gray'"
        @click="activeTab = 'benefit'"
      >
        혜택
      </button>
      <button
        type="button"
        class="flex-1 rounded-full py-2 text-caption font-semibold"
        :class="activeTab === 'performance' ? 'bg-white text-primary' : 'text-gray'"
        @click="activeTab = 'performance'"
      >
        실적
      </button>
    </div>

    <Transition name="tab-fade" mode="out-in">
      <div v-if="activeTab === 'benefit'" key="benefit" class="mt-4 space-y-7">
        <div v-if="isSummaryPending" class="flex items-center justify-center gap-2 py-10">
          <LoaderCircle class="text-primary size-6 animate-spin" />
        </div>
        <div v-else-if="isSummaryError" class="flex flex-col items-center gap-2 py-6 text-center">
          <p class="text-caption text-gray">혜택 요약을 불러오지 못했어요.</p>
          <button
            type="button"
            class="text-caption font-semibold text-primary"
            @click="() => refetchSummary()"
          >
            다시 시도
          </button>
        </div>
        <BenefitSummaryCard v-else-if="benefitSummary" :summary="benefitSummary" />

        <div v-if="isCategoriesPending" class="flex items-center justify-center gap-2 py-6">
          <LoaderCircle class="text-primary size-6 animate-spin" />
        </div>
        <div
          v-else-if="isCategoriesError"
          class="flex flex-col items-center gap-2 py-6 text-center"
        >
          <p class="text-caption text-gray">카테고리별 혜택을 불러오지 못했어요.</p>
          <button
            type="button"
            class="text-caption font-semibold text-primary"
            @click="() => refetchCategories()"
          >
            다시 시도
          </button>
        </div>
        <CategoryTop3List v-else-if="benefitCategories" :items="benefitCategories.categories" />

        <MissedBenefitsSection :year-month="activeYearMonth" />
      </div>
      <div v-else key="performance" class="mt-4 space-y-7">
        <CardPerformanceSummary :cards="MOCK_CARD_PERFORMANCES" />
        <div>
          <p class="text-subheading font-bold text-charcoal">카드별 실적 달성 현황</p>
          <div class="mt-3">
            <CardPerformanceList :cards="MOCK_CARD_PERFORMANCES" />
          </div>
        </div>
      </div>
    </Transition>
  </PageLayout>
</template>

<style scoped>
.tab-fade-enter-active,
.tab-fade-leave-active {
  transition:
    opacity 0.2s ease,
    transform 0.2s ease;
}

.tab-fade-enter-from,
.tab-fade-leave-to {
  opacity: 0;
  transform: translateY(6px);
}

@media (prefers-reduced-motion: reduce) {
  .tab-fade-enter-active,
  .tab-fade-leave-active {
    transition: none;
  }
}
</style>
