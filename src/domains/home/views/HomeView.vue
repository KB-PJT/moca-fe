<script setup lang="ts">
import { computed, ref } from 'vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import BenefitDetailSheet from '@/domains/home/components/BenefitDetailSheet.vue'
import CardBenefitAmounts from '@/domains/home/components/CardBenefitAmounts.vue'
import CardPerformance from '@/domains/home/components/CardPerformance.vue'
import HomeBenefitHeader from '@/domains/home/components/HomeBenefitHeader.vue'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import OwnedCardSection from '@/domains/home/components/OwnedCardSection.vue'
import RecentBenefitHistory from '@/domains/home/components/RecentBenefitHistory.vue'
import SelectedCardInfo from '@/domains/home/components/SelectedCardInfo.vue'
import { MOCK_HOME_OWNED_CARDS } from '@/domains/home/mocks/ownedCards'
import { MOCK_RECENT_BENEFITS } from '@/domains/home/mocks/recentBenefits'
import type { RecentBenefitItem } from '@/domains/home/mocks/recentBenefits'
import { useAuthStore } from '@/domains/auth/stores/auth'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

const activeCardIndex = ref(0)
const selectedBenefit = ref<RecentBenefitItem | null>(null)
const isDetailSheetOpen = ref(false)
const activeCard = computed(() => MOCK_HOME_OWNED_CARDS[activeCardIndex.value] ?? null)
const authStore = useAuthStore()
const cardMemoStore = useCardMemoStore()
const nickname = computed(() => authStore.user?.nickname ?? '사용자')
const missedBenefitAmount = computed(() =>
  MOCK_HOME_OWNED_CARDS.reduce((total, card) => total + card.availableBenefitAmount, 0),
)
const activeCardMemo = computed(() =>
  activeCard.value ? cardMemoStore.getMemo(activeCard.value.id) : '',
)

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

    <OwnedCardSection :card-count="MOCK_HOME_OWNED_CARDS.length" :active-index="activeCardIndex">
      <OwnedCardCarousel
        v-model:active-index="activeCardIndex"
        :cards="MOCK_HOME_OWNED_CARDS"
        :active-memo="activeCardMemo"
      />
      <SelectedCardInfo v-if="activeCard" :card="activeCard" />
      <CardBenefitAmounts v-if="activeCard" :card="activeCard" />
      <CardPerformance v-if="activeCard" :card="activeCard" />
    </OwnedCardSection>

    <RecentBenefitHistory :items="MOCK_RECENT_BENEFITS" @select="openBenefitDetail" />
  </PageLayout>

  <BenefitDetailSheet v-model:open="isDetailSheetOpen" :item="selectedBenefit" />
</template>
