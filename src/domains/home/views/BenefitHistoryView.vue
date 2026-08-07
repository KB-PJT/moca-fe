<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, ref } from 'vue'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import BenefitHistoryList from '@/domains/home/components/BenefitHistoryList.vue'
import { MOCK_HOME_OWNED_CARDS } from '@/domains/home/mocks/ownedCards'
import type { RecentBenefitItem } from '@/domains/home/mocks/recentBenefits'
import { MOCK_RECENT_BENEFITS } from '@/domains/home/mocks/recentBenefits'
import PageLayout from '@/shared/components/PageLayout.vue'

const selectedBenefit = ref<RecentBenefitItem | null>(null)
const isDetailSheetOpen = ref(false)
const selectedCardName = ref(MOCK_HOME_OWNED_CARDS[0]?.name ?? '')
const displayedMonth = ref(7)
const cardFilterDetails = ref<HTMLDetailsElement | null>(null)
const sortDetails = ref<HTMLDetailsElement | null>(null)
const sortOrder = ref<'latest' | 'oldest'>('latest')
const currencyFormatter = new Intl.NumberFormat('ko-KR')
const sortOptions = [
  { value: 'latest', label: '최신순' },
  { value: 'oldest', label: '과거순' },
] as const

const cardNames = computed(() => MOCK_HOME_OWNED_CARDS.map((card) => card.name))
const selectedCard = computed(() =>
  MOCK_HOME_OWNED_CARDS.find((card) => card.name === selectedCardName.value),
)
const filteredBenefits = computed(() => {
  if (displayedMonth.value !== 7) return []

  return MOCK_RECENT_BENEFITS.filter((item) => item.cardName === selectedCardName.value)
})
const monthlyBenefitTotal = computed(() =>
  filteredBenefits.value.reduce((total, item) => total + item.benefitAmount, 0),
)
const monthlyPaymentTotal = computed(() =>
  filteredBenefits.value
    .filter((item) => item.benefitAmount > 0)
    .reduce((total, item) => total + item.paymentAmount, 0),
)
const benefitSummary = computed(() => {
  const types = ['할인', '캐시백', '포인트'] as const

  return types.map((type) => {
    const amount = filteredBenefits.value
      .filter((item) => item.benefitType === type)
      .reduce((total, item) => total + item.benefitAmount, 0)

    return {
      type,
      amount,
      ratio: monthlyBenefitTotal.value ? (amount / monthlyBenefitTotal.value) * 100 : 0,
    }
  })
})
const groupedBenefits = computed(() => {
  const groups = new Map<string, RecentBenefitItem[]>()
  const benefits = [...filteredBenefits.value]

  if (sortOrder.value === 'oldest') benefits.reverse()

  benefits.forEach((item) => {
    const date = item.occurredAt.split(' ').slice(0, 2).join(' ')
    const items = groups.get(date) ?? []
    items.push(item)
    groups.set(date, items)
  })

  return [...groups.entries()].map(([date, items]) => ({ date, items }))
})

function openBenefitDetail(item: RecentBenefitItem) {
  selectedBenefit.value = item
  isDetailSheetOpen.value = true
}

function selectCard(cardName: string) {
  selectedCardName.value = cardName
  cardFilterDetails.value?.removeAttribute('open')
}

function changeMonth(offset: number) {
  displayedMonth.value = Math.min(Math.max(displayedMonth.value + offset, 1), 12)
}

function selectSort(order: 'latest' | 'oldest') {
  sortOrder.value = order
  sortDetails.value?.removeAttribute('open')
}
</script>

<template>
  <PageLayout title="전체 혜택 내역" has-bottom-bar :horizontal-padding="false">
    <div class="-my-6">
      <div class="flex items-center justify-between gap-3 px-5 pt-2 pb-5">
        <details ref="cardFilterDetails" class="relative min-w-0 flex-1">
          <summary
            class="flex w-full max-w-48 cursor-pointer list-none items-center gap-2 rounded-md border border-divider bg-card px-3 py-2 shadow-btn [&::-webkit-details-marker]:hidden"
          >
            <span
              class="size-5 shrink-0 rounded-xs"
              :style="{ backgroundColor: selectedCard?.accentColor ?? '#2A998B' }"
              aria-hidden="true"
            />
            <strong class="min-w-0 flex-1 truncate text-caption font-semibold text-charcoal">
              {{ selectedCardName }}
            </strong>
            <ChevronDown class="size-4 shrink-0 text-gray" aria-hidden="true" />
          </summary>

          <div
            class="absolute top-[calc(100%+0.5rem)] left-1/2 z-20 w-full min-w-72 -translate-x-1/2 overflow-hidden rounded-sm border border-divider bg-card py-1 shadow-card"
          >
            <button
              v-for="cardName in cardNames"
              :key="cardName"
              type="button"
              class="block w-full truncate px-4 py-3 text-left text-body transition-colors hover:bg-screen"
              :class="
                cardName === selectedCardName ? 'font-semibold text-primary' : 'text-charcoal'
              "
              @click="selectCard(cardName)"
            >
              {{ cardName }}
            </button>
          </div>
        </details>

        <div class="flex shrink-0 items-center gap-0.5" aria-label="혜택 조회 월 선택">
          <button
            type="button"
            class="flex size-8 items-center justify-center text-gray"
            aria-label="이전 달"
            @click="changeMonth(-1)"
          >
            <ChevronLeft class="size-4" aria-hidden="true" />
          </button>
          <strong class="w-9 text-center text-body font-semibold text-charcoal">
            {{ displayedMonth }}월
          </strong>
          <button
            type="button"
            class="flex size-8 items-center justify-center text-gray"
            aria-label="다음 달"
            @click="changeMonth(1)"
          >
            <ChevronRight class="size-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      <section class="px-5" aria-labelledby="monthly-benefit-title">
        <div class="rounded-md border border-divider bg-card px-5 py-4 shadow-card">
          <div>
            <h2 id="monthly-benefit-title" class="text-body font-semibold text-brown">
              {{ displayedMonth }}월 받은 혜택
            </h2>
            <p class="mt-1 text-title font-bold text-charcoal">
              {{ currencyFormatter.format(monthlyBenefitTotal)
              }}<span class="ml-0.5 text-subheading text-gray">원</span>
            </p>
          </div>

          <dl class="mt-3 flex flex-wrap gap-2">
            <div
              v-for="item in benefitSummary"
              :key="item.type"
              class="flex items-center gap-2 rounded-full px-3 py-1.5"
              :class="{
                'bg-[#FCF6F0]': item.type === '할인',
                'bg-[#F1F8F3]': item.type === '캐시백',
                'bg-[#F8F3EF]': item.type === '포인트',
              }"
            >
              <dt
                class="flex items-center gap-2 text-caption font-semibold"
                :class="{
                  'text-[#DC933C]': item.type === '할인',
                  'text-[#69A86E]': item.type === '캐시백',
                  'text-brown': item.type === '포인트',
                }"
              >
                <span
                  class="size-2 rounded-full"
                  :class="{
                    'bg-[#E8A54F]': item.type === '할인',
                    'bg-[#75B27D]': item.type === '캐시백',
                    'bg-brown': item.type === '포인트',
                  }"
                />
                {{ item.type }}
              </dt>
              <dd class="text-caption font-bold text-charcoal">
                {{ currencyFormatter.format(item.amount) }}원
              </dd>
            </div>
          </dl>

          <div class="mt-4 flex items-center justify-between">
            <span class="text-caption text-gray">혜택에 해당하는 결제</span>
            <strong class="text-body font-bold text-charcoal">
              {{ currencyFormatter.format(monthlyPaymentTotal) }}원
            </strong>
          </div>
          <div class="mt-2 h-2 overflow-hidden rounded-full bg-divider" aria-hidden="true">
            <div class="h-full w-3/4 rounded-full bg-[#EEDBCB]" />
          </div>
        </div>
      </section>

      <div v-if="groupedBenefits.length" class="px-7 pt-5 pb-6">
        <div class="mb-2 flex items-center justify-between">
          <strong class="text-caption font-semibold text-gray"
            >총 {{ filteredBenefits.length }}건</strong
          >
          <details ref="sortDetails" class="relative">
            <summary
              class="flex cursor-pointer list-none items-center gap-1 text-caption font-semibold text-brown [&::-webkit-details-marker]:hidden"
            >
              {{ sortOrder === 'latest' ? '최신순' : '과거순' }}
              <ChevronDown class="size-4" aria-hidden="true" />
            </summary>
            <div
              class="absolute top-7 right-0 z-10 w-24 overflow-hidden rounded-sm border border-divider bg-card py-1 shadow-card"
            >
              <button
                v-for="option in sortOptions"
                :key="option.value"
                type="button"
                class="block w-full px-4 py-2 text-left text-caption hover:bg-screen"
                :class="sortOrder === option.value ? 'font-semibold text-brown' : 'text-charcoal'"
                @click="selectSort(option.value)"
              >
                {{ option.label }}
              </button>
            </div>
          </details>
        </div>

        <section v-for="group in groupedBenefits" :key="group.date" class="pt-2">
          <div class="flex items-center gap-4">
            <h2 class="shrink-0 text-caption font-semibold text-gray">{{ group.date }}</h2>
            <span class="h-px flex-1 bg-divider" aria-hidden="true" />
          </div>
          <BenefitHistoryList variant="history" :items="group.items" @select="openBenefitDetail" />
        </section>
      </div>

      <p v-else class="px-5 py-20 text-center text-body text-[#8C7F74]">
        해당 월의 혜택 내역이 없어요.
      </p>
    </div>
  </PageLayout>

  <BenefitDetailSheet v-model:open="isDetailSheetOpen" :item="selectedBenefit" />
</template>
