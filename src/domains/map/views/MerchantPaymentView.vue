<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { Lock, LoaderCircle } from '@lucide/vue'
import { fetchMerchantCardRecommendations } from '@/domains/map/api/merchants'
import { formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import PageLayout from '@/shared/components/PageLayout.vue'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'

const route = useRoute()

// placeId는 `${merchantId}:${latitude}:${longitude}` 형태의 합성 키라, 실제 API 호출에 쓰는
// merchantId는 첫 구간만 떼어내면 된다 (toMerchant() 참고).
const merchantId = computed(() => String(route.params.placeId).split(':')[0] ?? '')
const merchantName = computed(() => String(route.query.name ?? ''))

const {
  data: recommendation,
  isPending,
  isError,
} = useQuery({
  queryKey: ['merchants', merchantId, 'card-recommendations'],
  queryFn: () => fetchMerchantCardRecommendations(merchantId.value),
})

const recommendedCard = computed(() => recommendation.value?.recommendedCard ?? null)

// TODO: 비밀번호 입력 → QR 노출 → 자동 스캔 완료 단계로 이어질 예정.
function confirmPayment() {
  // 다음 단계 미구현.
}
</script>

<template>
  <PageLayout :title="merchantName" bg="screen">
    <div v-if="isPending" class="flex h-full items-center justify-center">
      <LoaderCircle class="text-primary size-6 animate-spin" />
    </div>

    <div v-else-if="isError || !recommendedCard" class="flex h-full items-center justify-center">
      <p class="text-caption text-gray">추천 카드를 불러오지 못했어요.</p>
    </div>

    <div v-else class="flex h-full flex-col items-center justify-center gap-6 text-center">
      <CardImage
        :src="recommendedCard.cardImageUrl"
        :alt="`${recommendedCard.cardName} 카드 이미지`"
      />

      <div>
        <p class="text-subheading font-bold text-charcoal">{{ recommendedCard.cardName }}</p>
        <p class="mt-1 text-caption text-gray">{{ recommendedCard.benefitTitle }}</p>
        <p class="mt-2 text-subheading text-primary">{{ formatRewardLabel(recommendedCard) }}</p>
      </div>
    </div>

    <template #footer>
      <MocaButton block class="h-14 gap-2 rounded-md text-subheading!" @click="confirmPayment">
        <Lock class="size-4" />
        결제하기
      </MocaButton>
    </template>
  </PageLayout>
</template>
