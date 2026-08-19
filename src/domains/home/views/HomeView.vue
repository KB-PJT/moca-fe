<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { fetchHomeCards, toHomeOwnedCard, type HomeOwnedCard } from '@/domains/home/api/homeCards'
import { fetchHomeGreeting, type HomeGreetingResponse } from '@/domains/home/api/homeGreeting'
import { fetchRecentBenefits, type RecentBenefitItem } from '@/domains/home/api/recentBenefits'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import CardBenefitAmounts from '@/domains/home/components/CardBenefitAmounts.vue'
import CardPerformance from '@/domains/home/components/CardPerformance.vue'
import HomeBenefitHeader from '@/domains/home/components/HomeBenefitHeader.vue'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import OwnedCardSection from '@/domains/home/components/OwnedCardSection.vue'
import RecentBenefitHistory from '@/domains/home/components/RecentBenefitHistory.vue'
import SelectedCardInfo from '@/domains/home/components/SelectedCardInfo.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import { Skeleton } from '@/shared/ui/skeleton'
import { captureEvent } from '@/plugins/posthog'

const activeCardIndex = ref(0)
const cards = ref<HomeOwnedCard[]>([])
const isCardsLoading = ref(true)
const cardsError = ref('')
const greeting = ref<HomeGreetingResponse | null>(null)
const isGreetingLoading = ref(true)
const greetingError = ref('')
const recentBenefits = ref<RecentBenefitItem[]>([])
const isRecentBenefitsLoading = ref(true)
const recentBenefitsError = ref('')
let recentBenefitsRequestId = 0
const activeCard = computed(() => cards.value[activeCardIndex.value] ?? null)
const selectedBenefit = ref<RecentBenefitItem | null>(null)
const isDetailSheetOpen = ref(false)
const cardManagementStore = useCardManagementStore()
const activationNotice = ref(cardManagementStore.consumeActivationNotice())
const activeCardMemo = computed(() => activeCard.value?.highlightBenefitTitle ?? '')

async function loadHomeGreeting() {
  isGreetingLoading.value = true
  greetingError.value = ''

  try {
    greeting.value = await fetchHomeGreeting()
  } catch {
    greeting.value = null
    greetingError.value = '홈 혜택 정보를 불러오지 못했어요.'
    captureEvent('api_load_failed', { source: 'home_greeting' })
  } finally {
    isGreetingLoading.value = false
  }
}

async function loadHomeCards() {
  isCardsLoading.value = true
  cardsError.value = ''

  try {
    const response = await fetchHomeCards()
    cards.value = response?.cards.map(toHomeOwnedCard) ?? []
    cardManagementStore.setDetailNavigationCardIds(cards.value.map((card) => card.id))

    const selectedCardId = cardManagementStore.homeSelectedCardId ?? response?.selectedUserCardId
    const selectedIndex = selectedCardId
      ? cards.value.findIndex((card) => card.id === selectedCardId)
      : -1
    activeCardIndex.value = selectedIndex >= 0 ? selectedIndex : 0
    cardManagementStore.setHomeSelectedCardId(cards.value[activeCardIndex.value]?.id ?? null)
  } catch {
    cards.value = []
    cardManagementStore.setDetailNavigationCardIds([])
    activeCardIndex.value = 0
    cardsError.value = '보유카드를 불러오지 못했어요.'
    captureEvent('api_load_failed', { source: 'home_cards' })
  } finally {
    isCardsLoading.value = false
  }
}

async function loadRecentBenefits() {
  const requestId = ++recentBenefitsRequestId
  isRecentBenefitsLoading.value = true
  recentBenefitsError.value = ''

  try {
    const result = await fetchRecentBenefits(5)
    if (requestId !== recentBenefitsRequestId) return
    recentBenefits.value = result
  } catch {
    if (requestId !== recentBenefitsRequestId) return
    recentBenefits.value = []
    recentBenefitsError.value = '최근 결제 내역을 불러오지 못했어요.'
    captureEvent('api_load_failed', { source: 'home_recent_benefits' })
  } finally {
    if (requestId === recentBenefitsRequestId) isRecentBenefitsLoading.value = false
  }
}

onMounted(() => {
  void loadHomeGreeting()
  void loadHomeCards()
  void loadRecentBenefits()
})

function openBenefitDetail(item: RecentBenefitItem) {
  selectedBenefit.value = item
  isDetailSheetOpen.value = true
}

function selectCard(index: number) {
  activeCardIndex.value = index
  cardManagementStore.setHomeSelectedCardId(cards.value[index]?.id ?? null)
}
</script>

<template>
  <PageLayout hide-app-bar has-bottom-bar :horizontal-padding="false">
    <div class="px-5">
      <MainHeader title="MOCA" />
    </div>

    <p
      v-if="activationNotice"
      data-card-activation-notice
      class="mx-5 mb-4 rounded-md bg-primary/8 px-4 py-3 text-caption text-primary"
      role="status"
    >
      {{ activationNotice }}
    </p>

    <HomeBenefitHeader
      :nickname="greeting?.nickname ?? ''"
      :missed-benefit-amount="greeting?.missedBenefitAmount ?? 0"
      :is-loading="isGreetingLoading"
      :error="greetingError"
      @retry="loadHomeGreeting"
    />

    <OwnedCardSection>
      <div v-if="isCardsLoading" data-home-cards-loading class="px-5" aria-label="보유카드 로딩 중">
        <Skeleton class="mx-auto h-80 w-50 rounded-lg" />
        <Skeleton class="mt-5 h-18 w-full" />
      </div>
      <EmptyState
        v-else-if="cardsError"
        :title="cardsError"
        description="잠시 후 다시 시도해 주세요."
        action-label="다시 시도"
        @action="loadHomeCards"
      />
      <EmptyState
        v-else-if="cards.length === 0"
        title="연결된 카드가 없어요"
        description="카드를 연결하면 혜택과 실적을 확인할 수 있어요."
      />
      <template v-else>
        <OwnedCardCarousel
          :active-index="activeCardIndex"
          :cards="cards"
          :active-memo="activeCardMemo"
          @update:active-index="selectCard"
        />
        <SelectedCardInfo
          v-if="activeCard"
          :card="activeCard"
          :card-count="cards.length"
          :active-index="activeCardIndex"
        />
        <CardBenefitAmounts v-if="activeCard" :card="activeCard" />
        <CardPerformance v-if="activeCard" :card="activeCard" />
      </template>
    </OwnedCardSection>

    <RecentBenefitHistory
      :items="recentBenefits"
      :is-loading="isRecentBenefitsLoading"
      :error="recentBenefitsError"
      @select="openBenefitDetail"
      @retry="loadRecentBenefits"
    />
  </PageLayout>

  <BenefitDetailSheet v-model:open="isDetailSheetOpen" :item="selectedBenefit" />
</template>
