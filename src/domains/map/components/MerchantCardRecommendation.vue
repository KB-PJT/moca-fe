<script setup lang="ts">
import { computed, onActivated, onBeforeUnmount, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useQuery } from '@tanstack/vue-query'
import { CircleCheck, Info, LoaderCircle, Star, X } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { formatAmountWithUnit } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { fetchMerchantCardRecommendations } from '@/domains/map/api/merchants'
import { formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import { toConditionItems } from '@/domains/map/utils/benefitConditionMap'
import {
  gaugeFillPercent,
  hasPerformanceRequirement,
  isTierAchieved,
  maxTierAmount,
  nextUnachievedTier,
  tierMarkerAlign,
  tierPositionPercent,
  visibleTiers,
} from '@/domains/map/utils/tierGauge'
import MyCardRankingPreview from '@/domains/map/components/MyCardRankingPreview.vue'
import BenefitConditionList from '@/domains/map/components/BenefitConditionList.vue'
import CardImage from '@/shared/components/CardImage.vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import { captureEvent } from '@/plugins/posthog'

interface Props {
  merchant: Merchant
  // 압축 시트에서는 요약만 보이고, 펼쳐졌을 때만 추천 이유/카드 비교까지 보인다.
  expanded?: boolean
  // 상세에서 압축으로 되돌아가는 중(shrink 애니메이션 진행 중)인지. true가 되는 시점에
  // 맞춰 상세 전용 콘텐츠를 미리 페이드아웃한다 — expanded가 꺼지는 시점(애니메이션이 다
  // 끝난 뒤)까지 기다리면 트랜지션 없이 한 번에 사라져 잔상처럼 보인다.
  collapsing?: boolean
}

const props = defineProps<Props>()
const router = useRouter()

function monthlyLimitFillPercent(card: { monthlyUsedKrw: number; monthlyLimitKrw: number | null }) {
  if (!card.monthlyLimitKrw || card.monthlyLimitKrw <= 0) return 0
  return Math.min(100, Math.floor((card.monthlyUsedKrw / card.monthlyLimitKrw) * 100))
}

// 계산기에서 결제 금액을 입력해 "적용하기"를 누르면 이 값을 바꿔서 쿼리를 다시 호출한다.
// 초기 조회에는 임의의 기본 결제 금액을 가정하지 않고 amount 없이 요청한다 —
// rewardUnit이 percent/KRW/point/mile로 다양해서, 실제 예상 혜택은 서버가 계산한 값을 그대로 쓴다.
const paymentAmount = ref<number | undefined>(undefined)

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
    const [, previousMerchantId] = previousQuery.queryKey as [
      string,
      string,
      string,
      number | undefined,
    ]
    return previousMerchantId === merchantId.value ? previousData : undefined
  },
})

const recommendedCard = computed(() => recommendation.value?.recommendedCard ?? null)
const rankedCards = computed(() => recommendation.value?.rankedCards ?? [])
const merchantLabel = computed(() => `${props.merchant.name} · ${props.merchant.category}`)
const conditionItems = computed(() =>
  recommendedCard.value
    ? toConditionItems(recommendedCard.value.recommendationReasons, merchantLabel.value)
    : [],
)
// 압축된 하단 시트에서는 공간이 좁아 상위 3장까지만 보여준다. 펼쳐진 상세에서는 전체 순위를 보여준다.
const topRankedCards = computed(() => rankedCards.value.slice(0, 3))

watch(isError, (hasError) => {
  if (hasError) captureEvent('api_load_failed', { source: 'merchant_card_recommendations' })
})

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과. 데이터가 비동기로 오므로
// mount 시점이 아니라 recommendedCard가 실제로 생길 때마다 다시 재생한다.
const isFilled = ref(false)

watch(
  recommendedCard,
  (card, previousCard) => {
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
  },
  // immediate: true로, 컴포넌트가 (keep-alive 재활성화가 아니라) 완전히 새로 마운트됐는데
  // 쿼리 캐시엔 이미 결과가 있는 경우(다른 화면 갔다 router.back()으로 돌아오는 등)도 처리한다.
  // 이땐 recommendedCard가 "바뀌는" 게 아니라 처음부터 값이 있어서 watch가 아예 안 불렸고,
  // isFilled가 계속 false로 남아 게이지가 빈 채로 굳어 있었다.
  { immediate: true },
)

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

// 계산 결과로 1위 추천 카드가 바뀌면 알려주는 토스트. 재조회가 끝나 recommendedCard가
// 실제로 갱신되는 시점(watch)에 비교해야, 로딩 중인 이전 데이터와 비교하는 오탐을 피한다.
const isRankingChangedToastVisible = ref(false)
let rankingChangedToastTimer: ReturnType<typeof setTimeout> | undefined

function showRankingChangedToast() {
  if (rankingChangedToastTimer) clearTimeout(rankingChangedToastTimer)
  isRankingChangedToastVisible.value = true
  rankingChangedToastTimer = setTimeout(() => {
    isRankingChangedToastVisible.value = false
  }, 2500)
}

onBeforeUnmount(() => {
  if (rankingChangedToastTimer) clearTimeout(rankingChangedToastTimer)
})

function applyAmount() {
  if (!isValidAmountInput.value) return
  const amount = Number(paymentAmountInput.value)
  const previousTopCardId = recommendedCard.value?.userCardId ?? null

  appliedAmount.value = amount
  paymentAmount.value = amount
  captureEvent('benefit_calculator_used', {
    merchantId: props.merchant.merchantId,
    paymentAmount: amount,
  })

  const stopWatchingResult = watch(recommendedCard, (card) => {
    stopWatchingResult()
    if (card && previousTopCardId && card.userCardId !== previousTopCardId) {
      showRankingChangedToast()
    }
  })
}

function resetAmount() {
  appliedAmount.value = null
  paymentAmount.value = undefined
  paymentAmountInput.value = ''
}

// 계산기를 닫고 "계산해보기 / MOCA로 결제하기" 버튼 행으로 되돌아간다. 계산기 안에는
// 이걸 나갈 방법이 없어서(초기화/적용하기뿐) 한번 열면 못 빠져나오던 버그를 고친다.
function closeCalculator() {
  resetAmount()
  isCalculatorOpen.value = false
}

function startPayment() {
  if (!recommendedCard.value) return
  captureEvent('mock_payment_started', {
    merchantId: props.merchant.merchantId,
    cardName: recommendedCard.value.cardName,
  })
  router.push({
    name: 'merchant-payment',
    params: { placeId: props.merchant.placeId },
    query: {
      name: props.merchant.name,
      category: props.merchant.category,
      brand: props.merchant.brandName,
    },
  })
}

// 라우트 히스토리 이동 등으로 컴포넌트가 언마운트되지 않은 채 가맹점만 바뀌는 경우,
// 이전 가맹점 기준으로 열려 있던 계산기 상태가 새 가맹점에 그대로 남지 않도록 초기화한다.
watch(merchantId, () => {
  isCalculatorOpen.value = false
  paymentAmountInput.value = ''
  appliedAmount.value = null
  paymentAmount.value = undefined
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

      <div class="recommend-card-surface relative mt-2 space-y-3 overflow-hidden rounded-md p-3">
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
          <p class="text-caption text-gray">
            전월 실적 {{ formatAmountWithUnit(recommendedCard.previousMonthSpendKrw) }} /
            {{ formatAmountWithUnit(maxTierAmount(recommendedCard)) }}
          </p>

          <div
            class="relative mt-3 mb-3 h-1.5 rounded-full bg-divider"
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
              v-for="tier in visibleTiers(recommendedCard)"
              :key="tier.tier"
              class="absolute top-1/2 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold"
              :style="
                tierMarkerAlign(recommendedCard, tier) === 'center'
                  ? { left: `${tierPositionPercent(recommendedCard, tier)}%` }
                  : undefined
              "
              :class="[
                isTierAchieved(recommendedCard, tier)
                  ? 'bg-primary text-white'
                  : 'border-divider bg-card text-gray border',
                tierMarkerAlign(recommendedCard, tier) === 'start' && 'left-0',
                tierMarkerAlign(recommendedCard, tier) === 'center' && '-translate-x-1/2',
                tierMarkerAlign(recommendedCard, tier) === 'end' && 'right-0',
              ]"
            >
              {{ tier.tier }}
            </span>
          </div>

          <p
            v-if="nextUnachievedTier(recommendedCard)"
            class="text-caption text-charcoal text-right font-semibold"
          >
            {{ nextUnachievedTier(recommendedCard)!.tier }}구간까지
            <span class="text-primary">
              {{
                formatAmountWithUnit(
                  nextUnachievedTier(recommendedCard)!.requiredPreviousSpendKrw -
                    recommendedCard.previousMonthSpendKrw,
                )
              }}
            </span>
            남았어요!
          </p>
          <p
            v-else-if="visibleTiers(recommendedCard).length"
            class="text-caption text-success text-right font-semibold"
          >
            모든 구간 실적달성 완료
          </p>
        </template>

        <!-- tiers도 requiredPreviousSpendKrw도 없는 카드 = 전월 실적과 무관하게 항상 적용되는 혜택.
             다만 월 한도(monthlyLimitKrw)가 있으면 실적 대신 이번 달 한도 사용량을 보여준다 —
             그래야 한도를 다 써서 지금 적용 안 되는 경우를 "바로 적용돼요"라고 잘못 말하지 않는다. -->
        <template v-else-if="recommendedCard.monthlyLimitKrw != null">
          <p class="text-caption text-gray">
            이번 달 한도 {{ formatAmountWithUnit(recommendedCard.monthlyUsedKrw) }} /
            {{ formatAmountWithUnit(recommendedCard.monthlyLimitKrw) }}
          </p>

          <div
            class="relative mt-3 h-1.5 rounded-full bg-divider"
            role="progressbar"
            aria-label="이번 달 한도 사용률"
            aria-valuemin="0"
            aria-valuemax="100"
            :aria-valuenow="monthlyLimitFillPercent(recommendedCard)"
          >
            <div
              class="gauge-fill bg-primary h-full rounded-full transition-[width] duration-1000 ease-out"
              :style="{ width: `${isFilled ? monthlyLimitFillPercent(recommendedCard) : 0}%` }"
            />
          </div>

          <p class="text-caption text-charcoal text-right font-semibold mt-1.5">
            남은
            <span class="text-primary">
              {{ formatAmountWithUnit(recommendedCard.monthlyRemainingKrw ?? 0) }}
            </span>
          </p>
        </template>

        <p
          v-else
          class="text-caption text-success flex items-center justify-end gap-1 font-semibold"
        >
          <CircleCheck class="size-3.5" />
          실적 조건 없이 바로 적용돼요
        </p>

        <!-- 하단 시트(압축)에는 안 보이고 상세에서만 노출. -->
        <template v-if="expanded">
          <div v-if="!isCalculatorOpen" class="grid grid-cols-2 gap-2">
            <MocaButton variant="secondary" class="text-caption!" @click="isCalculatorOpen = true">
              계산해보기
            </MocaButton>
            <MocaButton class="text-caption!" @click="startPayment">MOCA로 결제하기</MocaButton>
          </div>

          <div v-else class="space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-caption font-semibold text-charcoal">실제 할인 금액 계산해보기</p>
              <button
                type="button"
                aria-label="계산기 닫기"
                class="text-gray"
                @click="closeCalculator"
              >
                <X class="size-4" />
              </button>
            </div>
            <Input
              v-model="paymentAmountInput"
              type="number"
              inputmode="numeric"
              placeholder="결제 금액을 입력해보세요"
              class="bg-card focus-visible:ring-0"
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
                v-if="appliedAmount === null"
                type="button"
                class="text-caption bg-primary disabled:opacity-40 flex-1 rounded-md py-2 text-white"
                :disabled="!isValidAmountInput"
                @click="applyAmount"
              >
                적용하기
              </button>
              <MocaButton v-else class="text-caption! flex-1" @click="startPayment">
                MOCA로 결제하기
              </MocaButton>
            </div>
          </div>
        </template>
      </div>

      <MyCardRankingPreview v-if="!expanded" :ranked-cards="topRankedCards" />

      <div
        v-if="expanded"
        class="transition-opacity duration-300"
        :class="collapsing ? 'opacity-0' : 'opacity-100'"
      >
        <div v-if="conditionItems.length" class="mt-6">
          <p class="text-subheading text-charcoal">추천 이유</p>
          <div class="mt-3">
            <!-- startDelayMs 160 = 바텀시트 expand() 트랜지션(320ms, useSheetTransition.ts)의
                 절반. 시트가 다 펼쳐진 뒤에야 시작되는 것처럼 보이지 않도록, 시트가 아직
                 슬라이드 중일 때 항목 등장이 겹쳐서 시작되게 맞춘다. -->
            <BenefitConditionList :items="conditionItems" :start-delay-ms="160" />
          </div>
        </div>

        <MyCardRankingPreview
          :ranked-cards="rankedCards"
          detailed
          :applied-amount="appliedAmount"
        />
      </div>
    </template>

    <p v-else class="text-caption text-gray mt-4">이 가맹점에서 받을 수 있는 혜택이 아직 없어요.</p>

    <Transition
      enter-active-class="transition duration-200 ease-out"
      enter-from-class="translate-y-2 opacity-0"
      leave-active-class="transition duration-150 ease-in"
      leave-to-class="translate-y-2 opacity-0"
    >
      <div
        v-if="isRankingChangedToastVisible"
        role="status"
        class="bg-charcoal fixed inset-x-5 bottom-[max(1rem,var(--safe-area-bottom))] z-50 flex items-center gap-2 rounded-2xl px-4 py-3 text-white shadow-lg"
      >
        <Info class="size-4 shrink-0 text-white/70" />
        <p class="flex-1 text-caption">혜택 순위가 바뀌었어요!</p>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.recommend-card-surface {
  background:
    radial-gradient(circle at 88% 8%, rgba(224, 130, 148, 0.24), transparent 42%),
    radial-gradient(circle at 4% 96%, rgba(255, 136, 54, 0.24), transparent 46%),
    linear-gradient(145deg, #fffaf3 0%, #fff2e4 50%, #fde8d6 100%);
}

/* 미세 노이즈로 매끈한 평면 대신 표면감을 준다 — 텍스트 위에는 거의 안 보일 정도로 옅게. */
.recommend-card-surface::before {
  content: '';
  position: absolute;
  inset: 0;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
  opacity: 0.05;
  mix-blend-mode: overlay;
  pointer-events: none;
}

@media (prefers-reduced-motion: reduce) {
  .gauge-fill {
    transition: none !important;
  }
}
</style>
