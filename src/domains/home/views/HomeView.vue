<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import EmptyState from '@/shared/components/EmptyState.vue'
import CardBenefitAmounts from '@/domains/home/components/CardBenefitAmounts.vue'
import CardPerformance from '@/domains/home/components/CardPerformance.vue'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import OwnedCardSection from '@/domains/home/components/OwnedCardSection.vue'
import SelectedCardInfo from '@/domains/home/components/SelectedCardInfo.vue'
import { fetchHomeCards, toHomeOwnedCard, type HomeOwnedCard } from '@/domains/home/api/homeCards'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'
import { Skeleton } from '@/shared/ui/skeleton'

const activeCardIndex = ref(0)
const cards = ref<HomeOwnedCard[]>([])
const isCardsLoading = ref(true)
const cardsError = ref('')
const activeCard = computed(() => cards.value[activeCardIndex.value] ?? null)
const cardMemoStore = useCardMemoStore()
const activeCardMemo = computed(() =>
  activeCard.value
    ? cardMemoStore.getMemo(activeCard.value.id) || activeCard.value.highlightBenefitTitle
    : '',
)

async function loadHomeCards() {
  isCardsLoading.value = true
  cardsError.value = ''

  try {
    const response = await fetchHomeCards()
    cards.value = response?.cards.map(toHomeOwnedCard) ?? []

    const selectedIndex = response?.selectedUserCardId
      ? cards.value.findIndex((card) => card.id === response.selectedUserCardId)
      : -1
    activeCardIndex.value = selectedIndex >= 0 ? selectedIndex : 0
  } catch {
    cards.value = []
    activeCardIndex.value = 0
    cardsError.value = '보유카드를 불러오지 못했어요.'
  } finally {
    isCardsLoading.value = false
  }
}

onMounted(loadHomeCards)
</script>

<template>
  <PageLayout hide-app-bar has-bottom-bar :horizontal-padding="false">
    <div class="px-5">
      <MainHeader title="MOCA" />
    </div>

    <SectionCard title="이번 달 혜택">
      <template #action>
        <RouterLink to="/report" class="text-caption text-primary">전체보기</RouterLink>
      </template>

      <p class="text-display text-charcoal">38,200원</p>
      <p class="text-body text-gray">2025.06.28 · 카드 결제</p>
    </SectionCard>

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

    <SectionCard title="버튼 예시">
      <div class="flex flex-col gap-2">
        <MocaButton block>연결 시작하기</MocaButton>
        <MocaButton variant="secondary" block>나중에 하기</MocaButton>
        <MocaButton variant="ghost" block>더보기</MocaButton>
        <MocaButton block disabled>비활성 버튼</MocaButton>
        <MocaButton block loading>불러오는 중</MocaButton>
      </div>
    </SectionCard>
  </PageLayout>
</template>
