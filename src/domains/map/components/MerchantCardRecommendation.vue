<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { Check, Star } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { formatAmountWithUnit, formatPercent } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants.mock'
import {
  cardRecommendationByPlaceId,
  type CardRecommendation,
} from '@/domains/map/api/cardRecommendation.mock'
import MyCardRankingPreview from '@/domains/map/components/MyCardRankingPreview.vue'
import CardImage from '@/shared/components/CardImage.vue'

interface Props {
  merchant: Merchant
  // 압축 시트에서는 요약만 보이고, 펼쳐졌을 때만 추천 이유/카드 비교/약관까지 보인다.
  expanded?: boolean
}

const props = defineProps<Props>()

const cardRecommendation = computed(
  () => cardRecommendationByPlaceId[props.merchant.placeId] ?? null,
)

// 게이지가 화면에 나타날 때 0%에서 실제 값까지 차오르는 효과. 실적탭 게이지와 동일한 연출.
const isFilled = ref(false)

onMounted(() => {
  requestAnimationFrame(() => {
    isFilled.value = true
  })
})

// 1구간을 달성하기 전까지는 "0 ~ 1구간" 구간만 채워서 보여주고,
// 1구간을 달성한 뒤에는 "1구간 ~ 2구간" 구간으로 기준을 다시 잡아서 보여준다.
// 그래서 최종 목표가 멀어도 게이지가 항상 의미 있는 진행률로 보인다.
function isTier1Reached(rec: CardRecommendation): boolean {
  return rec.performanceCurrentAmount >= rec.performanceTier1Amount
}

function gaugeFillPercent(rec: CardRecommendation): number {
  if (!isTier1Reached(rec)) {
    if (rec.performanceTier1Amount <= 0) return 100
    return Math.min(
      100,
      Math.floor((rec.performanceCurrentAmount / rec.performanceTier1Amount) * 100),
    )
  }

  const stageRange = rec.performanceRequiredAmount - rec.performanceTier1Amount
  if (stageRange <= 0) return 100

  const stageProgress = rec.performanceCurrentAmount - rec.performanceTier1Amount
  return Math.min(100, Math.floor((stageProgress / stageRange) * 100))
}

function nextTierLabel(rec: CardRecommendation): string | null {
  if (rec.performanceCurrentAmount >= rec.performanceRequiredAmount) return null
  return isTier1Reached(rec) ? '2구간' : '1구간'
}

function nextTierRemainingText(rec: CardRecommendation): string | null {
  if (rec.performanceCurrentAmount >= rec.performanceRequiredAmount) return null

  const tierTarget = isTier1Reached(rec)
    ? rec.performanceRequiredAmount
    : rec.performanceTier1Amount
  const remaining = tierTarget - rec.performanceCurrentAmount

  return formatAmountWithUnit(remaining)
}

// "실제 할인 금액 계산해보기" — 버튼을 누르면 결제 금액 입력칸이 나타나고,
// 입력한 금액에 할인율을 적용해 실제로 받을 혜택 금액을 바로 보여준다.
const isCalculatorOpen = ref(false)
const paymentAmountInput = ref('')

const calculatedBenefit = computed(() => {
  if (!cardRecommendation.value) return null

  const amount = Number(paymentAmountInput.value)
  if (!paymentAmountInput.value || Number.isNaN(amount) || amount <= 0) return null

  // 최소결제금액 미만이면 혜택이 아예 적용되지 않는다.
  if (amount < cardRecommendation.value.minPaymentAmount) return 0

  const rawBenefit = Math.floor(amount * (cardRecommendation.value.discountRate / 100))

  // 남은 월 한도를 넘는 금액은 한도만큼만 받을 수 있다.
  return Math.min(rawBenefit, cardRecommendation.value.remainingCap)
})

// "적용하기"를 누르면 입력한 결제 금액을 "내 카드 혜택 비교" 목록에도 반영해서,
// 퍼센트 대신 이 결제 금액 기준 실제 혜택 금액으로 바꿔 보여준다.
const appliedAmount = ref<number | null>(null)

function applyAmount() {
  const amount = Number(paymentAmountInput.value)
  if (!paymentAmountInput.value || Number.isNaN(amount) || amount <= 0) return
  appliedAmount.value = amount
}

function resetAmount() {
  appliedAmount.value = null
  paymentAmountInput.value = ''
}

// 라우트 히스토리 이동 등으로 컴포넌트가 언마운트되지 않은 채 가맹점만 바뀌는 경우,
// 이전 가맹점 기준으로 열려 있던 계산기 상태가 새 가맹점에 그대로 남지 않도록 초기화한다.
watch(
  () => props.merchant.placeId,
  () => {
    isCalculatorOpen.value = false
    paymentAmountInput.value = ''
    appliedAmount.value = null

    isFilled.value = false
    requestAnimationFrame(() => {
      isFilled.value = true
    })
  },
)
</script>

<template>
  <div>
    <template v-if="cardRecommendation">
      <p class="text-subheading text-primary mt-4 flex items-center gap-1">
        <Star class="size-4" />
        MOCA 추천 카드
      </p>

      <div class="bg-accent mt-2 space-y-3 rounded-md p-3">
        <div class="flex items-center gap-3">
          <CardImage
            :src="cardRecommendation.imageUrl"
            :alt="`${cardRecommendation.cardName} 카드 이미지`"
            small
          />

          <div class="min-w-0 flex-1">
            <p class="text-body text-charcoal truncate">{{ cardRecommendation.cardName }}</p>
            <p class="text-caption text-gray truncate">{{ cardRecommendation.reason }}</p>
          </div>

          <div class="shrink-0 text-right">
            <p class="text-subheading text-primary whitespace-nowrap">
              {{ formatPercent(cardRecommendation.discountRate) }} 할인
            </p>
            <p class="text-caption text-gray whitespace-nowrap">
              최소결제금액 {{ formatAmountWithUnit(cardRecommendation.minPaymentAmount) }}
            </p>
          </div>
        </div>

        <div class="bg-divider relative h-3 rounded-full">
          <div
            class="gauge-fill bg-primary h-full rounded-full transition-[width] duration-1000 ease-out"
            :style="{ width: `${isFilled ? gaugeFillPercent(cardRecommendation) : 0}%` }"
          />
          <span class="text-label absolute inset-0 flex items-center justify-center text-charcoal">
            {{ formatAmountWithUnit(cardRecommendation.performanceCurrentAmount) }}/{{
              formatAmountWithUnit(
                isTier1Reached(cardRecommendation)
                  ? cardRecommendation.performanceRequiredAmount
                  : cardRecommendation.performanceTier1Amount,
              )
            }}
          </span>
          <span
            v-if="isTier1Reached(cardRecommendation)"
            class="bg-primary absolute top-1/2 left-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-full text-[10px] font-bold text-white"
          >
            1
          </span>
          <span
            class="border-divider bg-card text-gray absolute top-1/2 right-0 flex size-5 -translate-y-1/2 items-center justify-center rounded-full border text-[10px] font-bold"
          >
            {{ isTier1Reached(cardRecommendation) ? '2' : '1' }}
          </span>
        </div>

        <p
          v-if="nextTierLabel(cardRecommendation)"
          class="text-caption text-charcoal text-right font-semibold"
        >
          {{ nextTierLabel(cardRecommendation) }} 실적까지
          <span class="text-primary">{{ nextTierRemainingText(cardRecommendation) }}</span>
          남았어요!
        </p>

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
            <p v-if="calculatedBenefit !== null" class="text-caption text-primary text-center">
              예상 혜택 {{ formatAmountWithUnit(calculatedBenefit) }}
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
                :disabled="calculatedBenefit === null"
                @click="applyAmount"
              >
                적용하기
              </button>
            </div>
          </div>
        </template>
      </div>

      <MyCardRankingPreview v-if="!expanded" :merchant="merchant" />

      <template v-if="expanded">
        <div class="mt-4 space-y-3">
          <p class="text-subheading text-charcoal">추천 이유</p>

          <div v-for="item in cardRecommendation.reasons" :key="item.label" class="text-center">
            <p class="flex items-center justify-center gap-1.5">
              <span
                class="bg-success flex size-4 shrink-0 items-center justify-center rounded-full text-white"
              >
                <Check class="size-3" />
              </span>
              <span class="text-body text-charcoal font-bold">{{ item.label }}</span>
            </p>
            <p class="text-label text-gray mt-1">{{ item.description }}</p>
          </div>
        </div>

        <MyCardRankingPreview :merchant="merchant" detailed :applied-amount="appliedAmount" />
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
