<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { ChevronLeft, ChevronRight, LoaderCircle } from '@lucide/vue'
import {
  fetchBenefitCategories,
  fetchBenefitSummary,
} from '@/domains/benefit-report/api/benefitReport'
import {
  fetchPerformanceCards,
  fetchPerformanceSummary,
  type PerformanceCardItem,
} from '@/domains/benefit-report/api/performanceReport'
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

const route = useRoute()
const router = useRouter()

// 실적 탭에서 카드 눌러 다른 화면으로 갔다가 뒤로가기로 돌아왔을 때도 실적 탭이 유지되도록
// 탭 상태를 URL 쿼리에 반영한다. 뒤로가기는 그 시점 URL(쿼리 포함)을 그대로 복원해준다.
// 다만 하단 탭바로 지도 등 아예 다른 화면에 갔다 오면 '/report'로 쿼리 없이 새로 이동하므로,
// 그 경우엔 마지막으로 선택했던 탭을 localStorage에서 복원한다. URL 쿼리가 명시돼 있으면
// (공유 링크 등) 그게 항상 우선한다.
const REPORT_TAB_STORAGE_KEY = 'report:activeTab'

function getStoredTab(): 'benefit' | 'performance' {
  return localStorage.getItem(REPORT_TAB_STORAGE_KEY) === 'performance' ? 'performance' : 'benefit'
}

function initialTab(): 'benefit' | 'performance' {
  if (route.query.tab === 'performance' || route.query.tab === 'benefit') return route.query.tab
  return getStoredTab()
}

const activeTab = ref<'benefit' | 'performance'>(initialTab())
const activeYearMonth = ref(currentYearMonth())

function setActiveTab(tab: 'benefit' | 'performance') {
  activeTab.value = tab
  localStorage.setItem(REPORT_TAB_STORAGE_KEY, tab)
  void router.replace({ query: { ...route.query, tab } })
}

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
const isPerformanceTabActive = computed(() => activeTab.value === 'performance')

const {
  data: benefitSummary,
  isPending: isSummaryPending,
  isError: isSummaryError,
  isFetching: isSummaryFetching,
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
  isFetching: isCategoriesFetching,
  refetch: refetchCategories,
} = useQuery({
  queryKey: computed(() => ['benefit-report', 'categories', activeYearMonth.value]),
  queryFn: () => fetchBenefitCategories({ yearMonth: activeYearMonth.value, limit: 3 }),
  enabled: isBenefitTabActive,
})

const {
  data: performanceSummary,
  isPending: isPerformanceSummaryPending,
  isError: isPerformanceSummaryError,
  isFetching: isPerformanceSummaryFetching,
  refetch: refetchPerformanceSummary,
} = useQuery({
  queryKey: computed(() => ['performance-report', 'summary', activeYearMonth.value]),
  queryFn: () => fetchPerformanceSummary(activeYearMonth.value),
  enabled: isPerformanceTabActive,
})

const {
  data: performanceCards,
  isPending: isPerformanceCardsPending,
  isError: isPerformanceCardsError,
  isFetching: isPerformanceCardsFetching,
  refetch: refetchPerformanceCards,
} = useQuery({
  queryKey: computed(() => ['performance-report', 'cards', activeYearMonth.value]),
  queryFn: () => fetchPerformanceCards(activeYearMonth.value),
  enabled: isPerformanceTabActive,
})

// 카드가 줄 수 있는 최종(최고) 구간 목표금액. CardPerformanceList의 동명 함수와 같은 계산이다.
function maxTierTarget(card: PerformanceCardItem): number {
  if (!card.tiers.length) return 0
  return Math.max(...card.tiers.map((tier) => tier.targetAmount))
}

// 실적 상단 요약 카드의 실적 총액. summary API엔 개수만 있고 금액이 없어 카드별 목록
// 응답(currentPerformanceAmount)을 합산해 내려준다. 최고 구간을 넘겨 쓴 금액은 혜택에
// 더 기여하지 않으므로, 카드별로 최고 구간 목표금액을 넘지 않게 잘라서 합산한다.
// 아직 안 불러왔으면 null로 둬서 요약 카드가 스켈레톤을 보여주게 한다.
const totalPerformanceAmount = computed(() => {
  if (!performanceCards.value) return null
  return performanceCards.value.cards.reduce((sum, card) => {
    const cap = maxTierTarget(card)
    const amount =
      cap > 0 ? Math.min(card.currentPerformanceAmount, cap) : card.currentPerformanceAmount
    return sum + amount
  }, 0)
})

// 실적 상단 요약 카드에 "가장 가까운 다음 달성"으로 보여줄, 미달성 카드 중 남은 금액이
// 가장 적은 카드. summary API엔 없는 정보라 카드별 목록 응답에서 계산해 내려준다.
const nearestAchievement = computed(() => {
  const cards = performanceCards.value?.cards ?? []
  const unmetCards = cards.filter((card) => !card.isCurrentTierAchieved)
  if (!unmetCards.length) return null

  const nearest = unmetCards.reduce((closest, card) =>
    card.remainingAmountToNextTier < closest.remainingAmountToNextTier ? card : closest,
  )
  return { cardName: nearest.cardName, remainingAmount: nearest.remainingAmountToNextTier }
})
</script>

<template>
  <PageLayout hide-app-bar has-bottom-bar>
    <MainHeader>
      <div class="flex w-full items-center justify-between">
        <div>
          <h1 class="text-subheading text-charcoal">{{ pageTitle }}</h1>
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
        @click="setActiveTab('benefit')"
      >
        혜택
      </button>
      <button
        type="button"
        class="flex-1 rounded-full py-2 text-caption font-semibold"
        :class="activeTab === 'performance' ? 'bg-white text-primary' : 'text-gray'"
        @click="setActiveTab('performance')"
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
            class="text-caption font-semibold text-primary disabled:opacity-50"
            :disabled="isSummaryFetching"
            @click="() => refetchSummary()"
          >
            {{ isSummaryFetching ? '재시도 중...' : '다시 시도' }}
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
            class="text-caption font-semibold text-primary disabled:opacity-50"
            :disabled="isCategoriesFetching"
            @click="() => refetchCategories()"
          >
            {{ isCategoriesFetching ? '재시도 중...' : '다시 시도' }}
          </button>
        </div>
        <CategoryTop3List v-else-if="benefitCategories" :items="benefitCategories.categories" />

        <MissedBenefitsSection :year-month="activeYearMonth" />
      </div>
      <div v-else key="performance" class="mt-4 space-y-7">
        <div
          v-if="isPerformanceSummaryPending"
          class="flex items-center justify-center gap-2 py-10"
        >
          <LoaderCircle class="text-primary size-6 animate-spin" />
        </div>
        <div
          v-else-if="isPerformanceSummaryError"
          class="flex flex-col items-center gap-2 py-6 text-center"
        >
          <p class="text-caption text-gray">실적 요약을 불러오지 못했어요.</p>
          <button
            type="button"
            class="text-caption font-semibold text-primary disabled:opacity-50"
            :disabled="isPerformanceSummaryFetching"
            @click="() => refetchPerformanceSummary()"
          >
            {{ isPerformanceSummaryFetching ? '재시도 중...' : '다시 시도' }}
          </button>
        </div>
        <CardPerformanceSummary
          v-else-if="performanceSummary"
          :summary="performanceSummary"
          :total-performance-amount="totalPerformanceAmount"
          :nearest-achievement="nearestAchievement"
        />

        <div>
          <p class="text-subheading font-bold text-charcoal">카드별 실적 달성 현황</p>
          <div class="mt-3">
            <div
              v-if="isPerformanceCardsPending"
              class="flex items-center justify-center gap-2 py-6"
            >
              <LoaderCircle class="text-primary size-6 animate-spin" />
            </div>
            <div
              v-else-if="isPerformanceCardsError"
              class="flex flex-col items-center gap-2 py-6 text-center"
            >
              <p class="text-caption text-gray">카드별 실적을 불러오지 못했어요.</p>
              <button
                type="button"
                class="text-caption font-semibold text-primary disabled:opacity-50"
                :disabled="isPerformanceCardsFetching"
                @click="() => refetchPerformanceCards()"
              >
                {{ isPerformanceCardsFetching ? '재시도 중...' : '다시 시도' }}
              </button>
            </div>
            <p
              v-else-if="performanceCards && performanceCards.cards.length === 0"
              class="rounded-lg border border-divider bg-card py-8 text-center text-caption text-gray"
            >
              등록된 카드가 없어요.
            </p>
            <CardPerformanceList v-else-if="performanceCards" :cards="performanceCards.cards" />
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
