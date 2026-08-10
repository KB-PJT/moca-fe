<script setup lang="ts">
import { computed, ref } from 'vue'
import { ChevronLeft, ChevronRight } from '@lucide/vue'
import {
  MOCK_CARD_PERFORMANCES,
  MOCK_MONTHLY_BENEFIT_SUMMARIES,
} from '@/domains/benefit-report/api/benefitReport.mock'
import PageLayout from '@/shared/components/PageLayout.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import BenefitSummaryCard from '@/domains/benefit-report/components/BenefitSummaryCard.vue'
import CategoryTop3List from '@/domains/benefit-report/components/CategoryTop3List.vue'
import MissedBenefitsSection from '@/domains/benefit-report/components/MissedBenefitsSection.vue'
import CardPerformanceSummary from '@/domains/benefit-report/components/CardPerformanceSummary.vue'
import CardPerformanceList from '@/domains/benefit-report/components/CardPerformanceList.vue'

const activeTab = ref<'benefit' | 'performance'>('benefit')
const monthIndex = ref(MOCK_MONTHLY_BENEFIT_SUMMARIES.length - 1)

const pageTitle = computed(() => (activeTab.value === 'benefit' ? '혜택 리포트' : '실적 리포트'))

const currentSummary = computed(() => MOCK_MONTHLY_BENEFIT_SUMMARIES[monthIndex.value]!)
const previousSummary = computed(() => MOCK_MONTHLY_BENEFIT_SUMMARIES[monthIndex.value - 1] ?? null)

const canGoPrevMonth = computed(() => monthIndex.value > 0)
const canGoNextMonth = computed(() => monthIndex.value < MOCK_MONTHLY_BENEFIT_SUMMARIES.length - 1)

const monthLabel = computed(() => {
  const [, month] = currentSummary.value.periodYm.split('-')
  return `${Number(month)}월`
})

function goToPrevMonth() {
  if (!canGoPrevMonth.value) return
  monthIndex.value -= 1
}

function goToNextMonth() {
  if (!canGoNextMonth.value) return
  monthIndex.value += 1
}
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
          <button
            type="button"
            class="text-gray disabled:opacity-30"
            :disabled="!canGoPrevMonth"
            @click="goToPrevMonth"
          >
            <ChevronLeft class="size-4" />
          </button>
          <span class="text-body font-semibold text-primary">{{ monthLabel }}</span>
          <button
            type="button"
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
        <BenefitSummaryCard
          :summary="currentSummary"
          :previous-total-amount="previousSummary?.totalAmount ?? null"
        />
        <CategoryTop3List :items="currentSummary.categoryTop3" />
        <MissedBenefitsSection />
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
