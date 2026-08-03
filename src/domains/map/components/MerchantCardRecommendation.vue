<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Check, Star } from '@lucide/vue'
import { Input } from '@/shared/ui/input'
import { formatAmountWithUnit, formatPercent } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants.mock'
import { cardRecommendationByPlaceId } from '@/domains/map/api/cardRecommendation.mock'
import { myCardRankingByPlaceId, type MyCardRankItem } from '@/domains/map/api/myCardRanking.mock'
import MyCardRankingPreview from '@/domains/map/components/MyCardRankingPreview.vue'

interface Props {
  merchant: Merchant
  // 압축 시트에서는 요약만 보이고, 펼쳐졌을 때만 추천 이유/카드 비교/약관까지 보인다.
  expanded?: boolean
}

const props = defineProps<Props>()

// 랭킹 순서대로 카드 비주얼 색을 다르게 준다 (실제 카드 디자인 데이터는 없음).
// MOCA 팔레트(brown 계열)에서만 골라서 브랜드 톤과 어긋나지 않게 한다.
const rankCardVisualClass = ['bg-brown', 'bg-brown-light', 'bg-charcoal']

const cardRecommendation = computed(
  () => cardRecommendationByPlaceId[props.merchant.placeId] ?? null,
)
const myCardRanking = computed(() => myCardRankingByPlaceId[props.merchant.placeId] ?? [])

function achievementPercent(current: number, required: number) {
  if (required <= 0) return 100
  return Math.min(100, (current / required) * 100)
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

function estimatedAmountFor(item: MyCardRankItem) {
  if (appliedAmount.value === null) return null
  return Math.floor(appliedAmount.value * (item.discountRate / 100))
}

// 라우트 히스토리 이동 등으로 컴포넌트가 언마운트되지 않은 채 가맹점만 바뀌는 경우,
// 이전 가맹점 기준으로 열려 있던 계산기 상태가 새 가맹점에 그대로 남지 않도록 초기화한다.
watch(
  () => props.merchant.placeId,
  () => {
    isCalculatorOpen.value = false
    paymentAmountInput.value = ''
    appliedAmount.value = null
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
          <div class="bg-brown h-10 w-7 shrink-0 rounded-md" />

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

        <div class="bg-divider h-1.5 overflow-hidden rounded-full">
          <div
            class="bg-primary h-full rounded-full"
            :style="{
              width:
                achievementPercent(
                  cardRecommendation.performanceCurrentAmount,
                  cardRecommendation.performanceRequiredAmount,
                ) + '%',
            }"
          />
        </div>

        <p class="text-label text-gray text-right">
          {{ formatAmountWithUnit(cardRecommendation.performanceCurrentAmount) }} /
          {{ formatAmountWithUnit(cardRecommendation.performanceRequiredAmount) }}
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

          <div v-for="item in cardRecommendation.reasons" :key="item.label" class="flex gap-2">
            <span
              class="bg-success mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full text-white"
            >
              <Check class="size-3" />
            </span>

            <div class="min-w-0">
              <p class="text-caption text-charcoal">{{ item.label }}</p>
              <p class="text-label text-gray">{{ item.description }}</p>
            </div>
          </div>
        </div>

        <div v-if="myCardRanking.length" class="mt-4">
          <p class="text-subheading text-charcoal">내 카드 혜택 비교</p>

          <!-- 압축 시트(MyCardRankingPreview)와 여백이 완전히 같도록, 별도 박스 없이 같은 행 구조를 쓴다.
               divide-y로 카드 사이만 구분선을 긋는다(마지막 항목엔 안 그어짐). -->
          <div class="divide-divider mt-2 divide-y">
            <div v-for="(item, index) in myCardRanking" :key="item.rank" class="py-3 first:pt-0">
              <div class="flex items-center gap-3">
                <div class="flex shrink-0 items-center gap-1">
                  <span class="text-caption text-primary w-6 shrink-0 font-bold"
                    >#{{ item.rank }}</span
                  >
                  <div
                    class="h-9 w-6 shrink-0 rounded-md"
                    :class="rankCardVisualClass[index % rankCardVisualClass.length]"
                  />
                </div>

                <div class="min-w-0 flex-1">
                  <p class="text-caption text-charcoal truncate">{{ item.cardName }}</p>
                  <p class="text-label text-gray truncate">{{ item.issuer }}</p>
                </div>

                <div class="shrink-0 text-right">
                  <p class="text-caption text-charcoal whitespace-nowrap">
                    {{
                      appliedAmount !== null
                        ? formatAmountWithUnit(estimatedAmountFor(item)!)
                        : item.benefitLabel
                    }}
                  </p>
                  <span
                    v-if="!item.performanceMet"
                    class="text-label bg-accent text-primary mt-1 inline-block rounded-full px-2 py-0.5 whitespace-nowrap"
                  >
                    조건 미충족
                  </span>
                </div>
              </div>

              <!-- 미충족 카드 밑에 왜 미충족인지 바로 알 수 있게 이 카드의 적용 조건을 눈에 띄는 회색 박스로 붙인다. -->
              <p
                v-if="!item.performanceMet && item.terms"
                class="text-label text-gray bg-screen mt-3 rounded-md p-3"
              >
                {{ item.terms }}
              </p>
            </div>
          </div>
        </div>
      </template>
    </template>

    <p v-else class="text-caption text-gray mt-4">이 가맹점에서 받을 수 있는 혜택이 아직 없어요.</p>
  </div>
</template>
