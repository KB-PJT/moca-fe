<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { useCardManagementStore } from '@/domains/card/stores/cardManagement'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'
import { fetchHomeCards, toHomeOwnedCard, type HomeOwnedCard } from '@/domains/home/api/homeCards'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import CardBenefitAmounts from '@/domains/home/components/CardBenefitAmounts.vue'
import CardPerformance from '@/domains/home/components/CardPerformance.vue'
import HomeBenefitHeader from '@/domains/home/components/HomeBenefitHeader.vue'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import OwnedCardSection from '@/domains/home/components/OwnedCardSection.vue'
import RecentBenefitHistory from '@/domains/home/components/RecentBenefitHistory.vue'
import SelectedCardInfo from '@/domains/home/components/SelectedCardInfo.vue'
import { MOCK_RECENT_BENEFITS, type RecentBenefitItem } from '@/domains/home/mocks/recentBenefits'
import EmptyState from '@/shared/components/EmptyState.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import { Skeleton } from '@/shared/ui/skeleton'

const activeCardIndex = ref(0)
const cards = ref<HomeOwnedCard[]>([])
const isCardsLoading = ref(true)
const cardsError = ref('')
const activeCard = computed(() => cards.value[activeCardIndex.value] ?? null)
const selectedBenefit = ref<RecentBenefitItem | null>(null)
const isDetailSheetOpen = ref(false)
const authStore = useAuthStore()
const cardManagementStore = useCardManagementStore()
const cardMemoStore = useCardMemoStore()
const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const missedBenefitAmount = computed(() =>
  cards.value.reduce((total, card) => total + card.availableBenefitAmount, 0),
)
const activeCardMemo = computed(() => {
  if (!activeCard.value) return ''

  return cardMemoStore.hasMemo(activeCard.value.id)
    ? cardMemoStore.getMemo(activeCard.value.id)
    : activeCard.value.memo || activeCard.value.highlightBenefitTitle
})

async function loadHomeCards() {
  isCardsLoading.value = true
  cardsError.value = ''

  try {
    const response = await fetchHomeCards()
    cards.value = response?.cards.map(toHomeOwnedCard) ?? []
    cardManagementStore.setDetailNavigationCardIds(cards.value.map((card) => card.id))

    const selectedIndex = response?.selectedUserCardId
      ? cards.value.findIndex((card) => card.id === response.selectedUserCardId)
      : -1
    activeCardIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  } catch {
    cards.value = []
    cardManagementStore.setDetailNavigationCardIds([])
    activeCardIndex.value = 0
    cardsError.value = '보유카드를 불러오지 못했어요.'
  } finally {
    isCardsLoading.value = false
  }
}

onMounted(loadHomeCards)

function openBenefitDetail(item: RecentBenefitItem) {
  selectedBenefit.value = item
  isDetailSheetOpen.value = true
}
</script>

<template>
  <PageLayout hide-app-bar has-bottom-bar :horizontal-padding="false">
    <div class="px-5">
      <MainHeader title="MOCA" />
    </div>

    <HomeBenefitHeader :nickname="nickname" :missed-benefit-amount="missedBenefitAmount" />

    <OwnedCardSection :card-count="cards.length" :active-index="activeCardIndex">
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
          v-model:active-index="activeCardIndex"
          :cards="cards"
          :active-memo="activeCardMemo"
        />
        <SelectedCardInfo v-if="activeCard" :card="activeCard" />
        <CardBenefitAmounts v-if="activeCard" :card="activeCard" />
        <CardPerformance v-if="activeCard" :card="activeCard" />
      </template>
    </OwnedCardSection>

    <RecentBenefitHistory :items="MOCK_RECENT_BENEFITS" @select="openBenefitDetail" />
  </PageLayout>

  <BenefitDetailSheet v-model:open="isDetailSheetOpen" :item="selectedBenefit" />
</template>
