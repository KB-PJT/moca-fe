<script setup lang="ts">
import { ChevronDown, ChevronLeft, ChevronRight } from '@lucide/vue'
import { computed, onMounted, ref } from 'vue'
import { useRoute } from 'vue-router'
import { fetchBenefitHistory, type BenefitHistorySummary } from '@/domains/home/api/benefitHistory'
import { fetchHomeCards } from '@/domains/home/api/homeCards'
import { captureEvent } from '@/plugins/posthog'
import type { RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import BenefitHistoryList from '@/domains/home/components/BenefitHistoryList.vue'
import CardImage from '@/shared/components/CardImage.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import { Skeleton } from '@/shared/ui/skeleton'

interface CardOption {
  id: string
  name: string
  imageUrl: string | null
}

const route = useRoute()
const now = new Date()
const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
const emptySummary = (): BenefitHistorySummary => ({
  totalBenefitAmount: 0,
  discountAmount: 0,
  cashbackAmount: 0,
  pointAmount: 0,
  mileageAmount: 0,
})

const selectedBenefit = ref<RecentBenefitItem | null>(null)
const isDetailSheetOpen = ref(false)
const cards = ref<CardOption[]>([])
const selectedCardId = ref('')
const yearMonth = ref(currentYearMonth)
const historyItems = ref<RecentBenefitItem[]>([])
const historySummary = ref<BenefitHistorySummary>(emptySummary())
const totalCount = ref(0)
const isLoading = ref(true)
const loadError = ref('')
let historyRequestId = 0
const cardFilterDetails = ref<HTMLDetailsElement | null>(null)
const sortDetails = ref<HTMLDetailsElement | null>(null)
const sortOrder = ref<'LATEST' | 'BENEFIT_DESC'>('LATEST')
const currencyFormatter = new Intl.NumberFormat('ko-KR')
const sortOptions = [
  { value: 'LATEST', label: '최신순' },
  { value: 'BENEFIT_DESC', label: '혜택금액순' },
] as const

const displayedMonth = computed(() => Number(yearMonth.value.slice(5, 7)))
const selectedCard = computed(() => cards.value.find((card) => card.id === selectedCardId.value))
const monthlyBenefitTotal = computed(() => historySummary.value.totalBenefitAmount)
const totalPaymentAmount = computed(() =>
  historyItems.value.reduce((total, item) => total + item.paymentAmount, 0),
)
const benefitPaymentAmount = computed(() =>
  historyItems.value.reduce(
    (total, item) =>
      item.benefitAmount > 0 &&
      (item.calculationStatus === 'APPLIED' || item.calculationStatus === 'PARTIALLY_APPLIED')
        ? total + item.paymentAmount
        : total,
    0,
  ),
)
const benefitPaymentRate = computed(() => {
  if (totalPaymentAmount.value <= 0) return 0
  return Math.min(Math.round((benefitPaymentAmount.value / totalPaymentAmount.value) * 100), 100)
})
const benefitSummary = computed(() => {
  return [
    { type: '할인' as const, amount: historySummary.value.discountAmount },
    { type: '캐시백' as const, amount: historySummary.value.cashbackAmount },
    { type: '포인트' as const, amount: historySummary.value.pointAmount },
    { type: '마일리지' as const, amount: historySummary.value.mileageAmount },
  ]
})
const groupedBenefits = computed(() => {
  const groups = new Map<string, RecentBenefitItem[]>()
  historyItems.value.forEach((item) => {
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

async function loadHistory() {
  if (!selectedCardId.value) return

  const requestId = ++historyRequestId
  const requestYearMonth = yearMonth.value
  const requestCardId = selectedCardId.value
  isLoading.value = true
  loadError.value = ''
  try {
    const result = await fetchBenefitHistory({
      yearMonth: requestYearMonth,
      userCardId: requestCardId,
      sort: sortOrder.value,
    })
    if (requestId !== historyRequestId) return
    historyItems.value = result.items
    historySummary.value = result.summary
    totalCount.value = result.totalCount
  } catch {
    if (requestId !== historyRequestId) return
    historyItems.value = []
    historySummary.value = emptySummary()
    totalCount.value = 0
    loadError.value = '혜택 내역을 불러오지 못했어요.'
    captureEvent('api_load_failed', { source: 'benefit_history' })
  } finally {
    if (requestId === historyRequestId) isLoading.value = false
  }
}

async function loadCardsAndHistory() {
  isLoading.value = true
  loadError.value = ''
  try {
    const response = await fetchHomeCards()
    cards.value =
      response?.cards.map((card) => ({
        id: card.userCardId,
        name: card.cardName,
        imageUrl: card.cardImageUrl,
      })) ?? []
    // 실적탭 카드를 눌러 들어온 경우 그 카드를 우선 선택한다. 쿼리 카드가 없거나
    // 본인 소유가 아니면(카드 목록에 없으면) 홈이 알려준 선택 카드로 대체한다.
    const requestedCardId =
      typeof route.query.userCardId === 'string' ? route.query.userCardId : null
    const responseSelectedCardId = response?.selectedUserCardId
    const preferredCardId = cards.value.some((card) => card.id === requestedCardId)
      ? requestedCardId
      : responseSelectedCardId
    selectedCardId.value = cards.value.some((card) => card.id === preferredCardId)
      ? (preferredCardId ?? '')
      : (cards.value[0]?.id ?? '')
    if (selectedCardId.value) await loadHistory()
    else isLoading.value = false
  } catch {
    cards.value = []
    isLoading.value = false
    loadError.value = '혜택 내역을 불러오지 못했어요.'
  }
}

function selectCard(cardId: string) {
  selectedCardId.value = cardId
  cardFilterDetails.value?.removeAttribute('open')
  void loadHistory()
}

function changeMonth(offset: number) {
  const [year, month] = yearMonth.value.split('-').map(Number)
  const date = new Date(year ?? now.getFullYear(), (month ?? 1) - 1 + offset, 1)
  yearMonth.value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
  void loadHistory()
}

function selectSort(order: 'LATEST' | 'BENEFIT_DESC') {
  sortOrder.value = order
  sortDetails.value?.removeAttribute('open')
  void loadHistory()
}

function retryHistory() {
  if (selectedCardId.value) {
    void loadHistory()
    return
  }

  void loadCardsAndHistory()
}

onMounted(loadCardsAndHistory)
</script>

<template>
  <PageLayout title="최근 전체 내역" has-bottom-bar :horizontal-padding="false">
    <div class="-my-6">
      <div class="flex items-center justify-between gap-3 px-5 pt-2 pb-5">
        <details ref="cardFilterDetails" class="relative w-48 shrink-0">
          <summary
            class="flex w-full cursor-pointer list-none items-center gap-2 rounded-md border border-divider bg-card px-3 py-2 shadow-btn [&::-webkit-details-marker]:hidden"
          >
            <CardImage
              :src="selectedCard?.imageUrl"
              :alt="`${selectedCard?.name ?? '카드'} 이미지`"
              orientation="horizontal"
              :width="28"
              :height="18"
            />
            <strong class="min-w-0 flex-1 truncate text-caption font-semibold text-charcoal">
              {{ selectedCard?.name ?? '카드 선택' }}
            </strong>
            <ChevronDown class="size-4 shrink-0 text-gray" aria-hidden="true" />
          </summary>

          <div
            class="absolute top-[calc(100%+0.5rem)] left-0 z-20 w-full overflow-hidden rounded-md border border-divider bg-card py-1 shadow-card"
          >
            <button
              v-for="card in cards"
              :key="card.id"
              type="button"
              class="block w-full truncate px-3 py-3 text-left text-caption transition-colors hover:bg-screen"
              :class="card.id === selectedCardId ? 'font-semibold text-primary' : 'text-charcoal'"
              @click="selectCard(card.id)"
            >
              {{ card.name }}
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

      <div v-if="isLoading" class="space-y-4 px-5" aria-label="혜택 내역 로딩 중">
        <Skeleton class="h-64 w-full rounded-md" />
        <Skeleton v-for="index in 3" :key="index" class="h-18 w-full rounded-md" />
      </div>
      <EmptyState
        v-else-if="loadError"
        :title="loadError"
        description="잠시 후 다시 시도해 주세요."
        action-label="다시 시도"
        @action="retryHistory"
      />

      <section v-else class="px-5" aria-labelledby="monthly-benefit-title">
        <div class="rounded-md border border-divider bg-card px-5 py-4">
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
                'bg-[#EDF7FC]': item.type === '마일리지',
              }"
            >
              <dt
                class="flex items-center gap-2 text-caption font-semibold"
                :class="{
                  'text-[#DC933C]': item.type === '할인',
                  'text-[#69A86E]': item.type === '캐시백',
                  'text-brown': item.type === '포인트',
                  'text-[#4B9CC6]': item.type === '마일리지',
                }"
              >
                <span
                  class="size-2 rounded-full"
                  :class="{
                    'bg-[#E8A54F]': item.type === '할인',
                    'bg-[#75B27D]': item.type === '캐시백',
                    'bg-brown': item.type === '포인트',
                    'bg-[#4B9CC6]': item.type === '마일리지',
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
              {{ currencyFormatter.format(benefitPaymentAmount) }}원
            </strong>
          </div>
          <div
            class="mt-2 h-2 overflow-hidden rounded-full bg-divider"
            role="progressbar"
            aria-label="전체 결제 중 혜택받은 결제 비율"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="benefitPaymentRate"
          >
            <div
              class="h-full rounded-full bg-primary"
              :style="{ width: `${benefitPaymentRate}%` }"
            />
          </div>
        </div>
      </section>

      <div v-if="!isLoading && !loadError && groupedBenefits.length" class="px-7 pt-5 pb-6">
        <div class="mb-2 flex items-center justify-between">
          <strong class="text-caption font-semibold text-gray">총 {{ totalCount }}건</strong>
          <details ref="sortDetails" class="relative">
            <summary
              class="flex cursor-pointer list-none items-center gap-1 text-caption font-semibold text-brown [&::-webkit-details-marker]:hidden"
            >
              {{ sortOrder === 'LATEST' ? '최신순' : '혜택금액순' }}
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

      <p
        v-else-if="!isLoading && !loadError"
        class="px-5 py-20 text-center text-body text-[#8C7F74]"
      >
        해당 월의 혜택 내역이 없어요.
      </p>
    </div>
  </PageLayout>

  <BenefitDetailSheet v-model:open="isDetailSheetOpen" :item="selectedBenefit" />
</template>
