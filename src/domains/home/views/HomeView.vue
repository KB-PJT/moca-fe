<script setup lang="ts">
import { computed, ref } from 'vue'
import PageLayout from '@/shared/components/PageLayout.vue'
import SectionCard from '@/shared/components/SectionCard.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import MainHeader from '@/shared/components/MainHeader.vue'
import CardBenefitAmounts from '@/domains/home/components/CardBenefitAmounts.vue'
import CardPerformance from '@/domains/home/components/CardPerformance.vue'
import OwnedCardCarousel from '@/domains/home/components/OwnedCardCarousel.vue'
import OwnedCardSection from '@/domains/home/components/OwnedCardSection.vue'
import SelectedCardInfo from '@/domains/home/components/SelectedCardInfo.vue'
import { MOCK_HOME_OWNED_CARDS } from '@/domains/home/mocks/ownedCards'
import { useCardMemoStore } from '@/domains/card/stores/cardMemo'

const activeCardIndex = ref(0)
const activeCard = computed(() => MOCK_HOME_OWNED_CARDS[activeCardIndex.value] ?? null)
const cardMemoStore = useCardMemoStore()
const activeCardMemo = computed(() =>
  activeCard.value ? cardMemoStore.getMemo(activeCard.value.id) : '',
)
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
