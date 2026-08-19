<script setup lang="ts">
import { computed, onActivated, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Check, LoaderCircle, Star } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { formatAmountWithUnit } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { fetchMerchantCardRecommendations } from '@/domains/map/api/merchants'
import { describeRecommendationReason, formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import {
  gaugeFillPercent,
  hasPerformanceRequirement,
  segmentEndAmount,
  targetTierNumber,
} from '@/domains/map/utils/tierGauge'
import MyCardRankingPreview from '@/domains/map/components/MyCardRankingPreview.vue'
import CardImage from '@/shared/components/CardImage.vue'
import { captureEvent } from '@/plugins/posthog'

interface Props {
  merchant: Merchant
  // 압축 시트에서는 요약만 보이고, 펼쳐졌을 때만 추천 이유/카드 비교까지 보인다.
  expanded?: boolean
}

const props = defineProps<Props>()

const DEFAULT_PAYMENT_AMOUNT = 10000

// 계산기에서 결제 금액을 입력해 "적용하기"를 누르면 이 값을 바꿔서 쿼리를 다시 호출한다.
// rewardUnit이 percent/KRW/point/mile로 다양해서, 실제 예상 혜택은 서버가 계산한 값을 그대로 쓴다.
const paymentAmount = ref(DEFAULT_PAYMENT_AMOUNT)

const merchantId = computed(() => props.merchant.merchantId)

const {
  data: recommendation,
  isPending,
  isFetching,
  isError,
  refetch,
} = useQuery({
  queryKey: ['merchants', merchantId, 'card-recommendations', paymentAmount],
  queryFn: () => fetchMerchantCardRecommendations(merchantId.value, paymentAmount.value),
  // 결제 금액만 바뀐 재계산(같은 가맹점)에서는 이전 카드 내용을 유지하다 갱신해서
  // "계산 중..." 문구로 자연스럽게 보이게 한다. 가맹점 자체가 바뀐 경우까지 이전 데이터를
  // 유지하면 새 가맹점 헤더 아래 직전 가맹점의 추천 카드가 잠깐 보이는 문제가 생기므로,
  // 쿼리키의 merchantId가 같을 때만 이전 데이터를 재사용한다.
  placeholderData: (previousData, previousQuery) => {
    if (!previousQuery) return undefined
    const [, previousMerchantId] = previousQuery.queryKey as [string, string, string, number]
    return previousMerchantId === merchantId.value ? previousData : undefined
  },
})

const recommendedCard = computed(() => recommendation.value?.recommendedCard ?? null)
const rankedCards = computed(() => recommendation.value?.rankedCards ?? [])
// 압축된 하단 시트에서는 공간이 좁아 상위 3장까지만 보여준다. 펼쳐진 상세에서는 전체 순위를 보여준다.
const topRankedCards = computed(() => rankedCards.value.slice(0, 3))

watch(isError, (hasError) => {
  if (hasError) captureEvent('api_load_failed', { source: 'merchant_card_recommendations' })
})

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과. 데이터가 비동기로 오므로
// mount 시점이 아니라 recommendedCard가 실제로 생길 때마다 다시 재생한다.
const isFilled = ref(false)

watch(recommendedCard, (card, previousCard) => {
  if (!card) return
  isFilled.value = false
  requestAnimationFrame(() => {
    isFilled.value = true
  })

  // 결제 금액 재계산으로 같은 추천 결과가 갱신될 때마다가 아니라, 새 가맹점의 추천 결과를
  // 처음 확인했을 때만 잡는다.
  if (!previousCard) {
    captureEvent('card_recommendation_viewed', {
      merchantId: props.merchant.merchantId,
      cardName: card.cardName,
    })
  }
})

// 지도 탭이 KeepAlive로 캐싱되면서, 다른 탭에 갔다가 돌아오는 건 recommendedCard가
// 바뀌는 게 아니라 이 컴포넌트가 비활성화(deactivated)됐다 재활성화(activated)되는
// 것이다. 위 watch는 값이 "바뀔 때"만 반응해서 이 경우엔 안 걸리므로, 재활성화 시점에
// 이미 추천 카드가 있으면 게이지가 빈 채로 남지 않도록 다시 채워준다.
onActivated(() => {
  if (recommendedCard.value) {
    isFilled.value = true
  }
})

// "실제 할인 금액 계산해보기" — 버튼을 누르면 결제 금액 입력칸이 나타나고, 적용하면
// 그 금액으로 쿼리를 다시 호출해 서버가 계산한 실제 예상 혜택 금액을 보여준다.
const isCalculatorOpen = ref(false)
const paymentAmountInput = ref('')
const appliedAmount = ref<number | null>(null)

const isValidAmountInput = computed(() => {
  const amount = Number(paymentAmountInput.value)
  return Boolean(paymentAmountInput.value) && !Number.isNaN(amount) && amount > 0
})

function applyAmount() {
  if (!isValidAmountInput.value) return
  const amount = Number(paymentAmountInput.value)
  appliedAmount.value = amount
  paymentAmount.value = amount
  captureEvent('benefit_calculator_used', {
    merchantId: props.merchant.merchantId,
    paymentAmount: amount,
  })
}

function resetAmount() {
  appliedAmount.value = null
  paymentAmount.value = DEFAULT_PAYMENT_AMOUNT
  paymentAmountInput.value = ''
}

// 라우트 히스토리 이동 등으로 컴포넌트가 언마운트되지 않은 채 가맹점만 바뀌는 경우,
// 이전 가맹점 기준으로 열려 있던 계산기 상태가 새 가맹점에 그대로 남지 않도록 초기화한다.
watch(merchantId, () => {
  isCalculatorOpen.value = false
  paymentAmountInput.value = ''
  appliedAmount.value = null
  paymentAmount.value = DEFAULT_PAYMENT_AMOUNT
})
</script>

<template>
  <div>
    <div
      v-if="isPending"
      role="status"
      aria-live="polite"
      class="mt-4 flex items-center gap-2 py-1"
    >
      <LoaderCircle class="text-primary size-4 animate-spin" />
      <span class="text-caption text-gray">추천 카드를 불러오는 중...</span>
    </div>

    <!-- recommendedCard가 이미 있으면(결제 금액 재계산 실패 등) 전체를 지우지 않고 카드 안에서 인라인으로 알린다. -->
    <div
      v-else-if="isError && !recommendedCard"
      role="alert"
      class="bg-accent mt-4 flex items-center justify-between gap-2 rounded-md px-3 py-2"
    >
      <p class="text-caption text-gray">추천 카드를 불러오지 못했어요.</p>
      <button
        type="button"
        class="text-caption text-primary font-semibold"
        @click="() => refetch()"
      >
        다시 시도
      </button>
    </div>

    <template v-else-if="recommendedCard">
      <p class="text-subheading text-primary mt-4 flex items-center gap-1">
        <Star class="size-4" />
        MOCA 추천 카드
      </p>

      <div class="bg-accent mt-2 space-y-3 rounded-md p-3">
        <div class="flex items-center gap-3">
          <CardImage
            :src="recommendedCard.cardImageUrl"
            :alt="`${recommendedCard.cardName} 카드 이미지`"
            small
          />

          <div class="min-w-0 flex-1">
            <p class="text-body font-bold text-charcoal truncate">{{ recommendedCard.cardName }}</p>
            <p class="text-caption text-gray truncate">{{ recommendedCard.benefitTitle }}</p>
          </div>

          <div class="shrink-0 text-right">
            <p class="text-subheading text-primary whitespace-nowrap">
              {{ formatRewardLabel(recommendedCard) }}
            </p>
            <p
              v-if="recommendedCard.transactionMinKrw"
              class="text-caption text-gray whitespace-nowrap"
            >
              최소결제금액 {{ formatAmountWithUnit(recommendedCard.transactionMinKrw) }}
            </p>
          </div>
        </div>

        <template v-if="hasPerformanceRequirement(recommendedCard)">
          <div
            class="bg-divider relative h-3 rounded-full"
            role="progressbar"
            aria-label="전월 실적 달성률"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="gaugeFillPercent(recommendedCard)"
          >
            <div
              class="gauge-fill bg-primary h-full rounded-full transition-[width] duration-1000 ease-out"
              :style="{ width: `${isFilled ? gaugeFillPercent(recommendedCard) : 0}%` }"
            />
            <span
              class="text-label absolute inset-0 flex items-center justify-center text-charcoal"
            >
              {{ formatAmountWithUnit(recommendedCard.previousMonthSpendKrw) }}/{{
                formatAmountWithUnit(segmentEndAmount(recommendedCard))
              }}
            </span>
            <span
              v-if="recommendedCard.isCurrentTierAchieved"
              class="bg-primary absolute top-1/2 left-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white"
            >
              {{ recommendedCard.currentTier }}
            </span>
            <span
              v-if="targetTierNumber(recommendedCard) !== null"
              class="border-divider bg-card text-gray absolute top-1/2 right-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold"
            >
              {{ targetTierNumber(recommendedCard) }}
            </span>
          </div>

          <p
            v-if="recommendedCard.remainingAmountToNextTier > 0"
            class="text-caption text-charcoal text-right font-semibold"
          >
            {{ targetTierNumber(recommendedCard) }}구간까지
            <span class="text-primary">
              {{ formatAmountWithUnit(recommendedCard.remainingAmountToNextTier) }}
            </span>
            남았어요!
          </p>
        </template>

        <!-- 하단 시트(압축)에는 안 보이고 상세에서만 노출. -->
        <template v-if="expanded">
          <button
            v-if="!isCalculatorOpen"
            type="button"
            class="text-caption bg-card text-gray hover:bg-primary w-full rounded-md py-2 transition-colors hover:text-white"
            @click="isCalculatorOpen = true"
          >
            실제 할인 금액 계산해보기
          </button>

          <div v-else class="space-y-2">
            <Input
              v-model="paymentAmountInput"
              type="number"
              inputmode="numeric"
              placeholder="결제 금액을 입력해보세요"
              class="bg-card"
              autofocus
            />
            <p
              v-if="isFetching && appliedAmount !== null"
              role="status"
              aria-live="polite"
              class="text-caption text-gray text-center"
            >
              계산 중...
            </p>
            <p
              v-else-if="isError && appliedAmount !== null"
              role="alert"
              class="text-caption text-error text-center"
            >
              계산에 실패했어요. 다시 시도해주세요.
            </p>
            <p v-else-if="appliedAmount !== null" class="text-caption text-primary text-center">
              예상 혜택 {{ formatAmountWithUnit(recommendedCard.estimatedValueKrw) }}
            </p>
            <div class="flex gap-2">
              <button
                v-if="appliedAmount !== null"
                type="button"
                class="text-caption bg-card text-gray border-divider flex-1 rounded-md border py-2"
                @click="resetAmount"
              >
                초기화
              </button>
              <button
                type="button"
                class="text-caption bg-primary disabled:opacity-40 flex-1 rounded-md py-2 text-white"
                :disabled="!isValidAmountInput"
                @click="applyAmount"
              >
                적용하기
              </button>
            </div>
          </div>
        </template>
      </div>

      <MyCardRankingPreview v-if="!expanded" :ranked-cards="topRankedCards" />

      <template v-if="expanded">
        <div
          v-if="recommendedCard.recommendationReasons.some((reason) => reason.satisfied)"
          class="mt-4 space-y-3"
        >
          <p class="text-subheading text-charcoal">추천 이유</p>

          <div
            v-for="reason in recommendedCard.recommendationReasons.filter((item) => item.satisfied)"
            :key="reason.code"
            class="flex items-center gap-1.5"
          >
            <span
              class="bg-success flex size-4 shrink-0 items-center justify-center rounded-full text-white"
            >
              <Check class="size-3" />
            </span>
            <p class="text-body text-charcoal min-w-0 font-bold">
              {{ describeRecommendationReason(reason) }}
            </p>
          </div>
        </div>

        <MyCardRankingPreview
          :ranked-cards="rankedCards"
          detailed
          :applied-amount="appliedAmount"
        />
      </template>
    </template>

    <p v-else class="text-caption text-gray mt-4">이 가맹점에서 받을 수 있는 혜택이 아직 없어요.</p>
  </div>
</template>

<style scoped>
@media (prefers-reduced-motion: reduce) {
  .gauge-fill {
    transition: none !important;
  }
}
</style>
