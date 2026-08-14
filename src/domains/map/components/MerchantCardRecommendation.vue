<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { Check, LoaderCircle, Star } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { formatAmountWithUnit } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { fetchMerchantCardRecommendations } from '@/domains/map/api/merchants'
import { describeRecommendationReason, formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import MyCardRankingPreview from '@/domains/map/components/MyCardRankingPreview.vue'
import CardImage from '@/shared/components/CardImage.vue'

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

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과. 데이터가 비동기로 오므로
// mount 시점이 아니라 recommendedCard가 실제로 생길 때마다 다시 재생한다.
const isFilled = ref(false)

watch(recommendedCard, (card) => {
  if (!card) return
  isFilled.value = false
  requestAnimationFrame(() => {
    isFilled.value = true
  })
})

function hasPerformanceRequirement(requiredPreviousSpendKrw: number | null): boolean {
  return requiredPreviousSpendKrw != null
}

function gaugeFillPercent(
  previousMonthSpendKrw: number,
  requiredPreviousSpendKrw: number | null,
): number {
  if (requiredPreviousSpendKrw == null || requiredPreviousSpendKrw <= 0) return 100
  return Math.min(100, Math.floor((previousMonthSpendKrw / requiredPreviousSpendKrw) * 100))
}

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
            <p class="text-body text-charcoal truncate">{{ recommendedCard.cardName }}</p>
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

        <template v-if="hasPerformanceRequirement(recommendedCard.requiredPreviousSpendKrw)">
          <div
            class="bg-divider relative h-3 rounded-full"
            role="progressbar"
            aria-label="전월 실적 달성률"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="
              gaugeFillPercent(
                recommendedCard.previousMonthSpendKrw,
                recommendedCard.requiredPreviousSpendKrw,
              )
            "
          >
            <div
              class="gauge-fill bg-primary h-full rounded-full transition-[width] duration-1000 ease-out"
              :style="{
                width: `${
                  isFilled
                    ? gaugeFillPercent(
                        recommendedCard.previousMonthSpendKrw,
                        recommendedCard.requiredPreviousSpendKrw,
                      )
                    : 0
                }%`,
              }"
            />
            <span
              class="text-label absolute inset-0 flex items-center justify-center text-charcoal"
            >
              {{ formatAmountWithUnit(recommendedCard.previousMonthSpendKrw) }}/{{
                formatAmountWithUnit(recommendedCard.requiredPreviousSpendKrw!)
              }}
            </span>
          </div>

          <p
            v-if="recommendedCard.remainingPreviousSpendKrw > 0"
            class="text-caption text-charcoal text-right font-semibold"
          >
            실적까지
            <span class="text-primary">
              {{ formatAmountWithUnit(recommendedCard.remainingPreviousSpendKrw) }}
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

      <MyCardRankingPreview v-if="!expanded" :ranked-cards="rankedCards" />

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
