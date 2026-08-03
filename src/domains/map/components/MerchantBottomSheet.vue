<script setup lang="ts">
import { computed } from 'vue'
import { Coffee, ShoppingBag, ShoppingCart, Star, Utensils, X } from '@lucide/vue'
import { formatAmountWithUnit, formatDistance, formatPercent } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants.mock'
import { cardRecommendationByPlaceId } from '@/domains/map/api/cardRecommendation.mock'
import { myCardRankingByPlaceId } from '@/domains/map/api/myCardRanking.mock'

interface Props {
  merchant: Merchant
}

const props = defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const categoryIcon: Record<Merchant['category'], typeof Utensils> = {
  음식점: Utensils,
  카페: Coffee,
  편의점: ShoppingBag,
  마트: ShoppingCart,
}

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
</script>

<template>
  <div class="relative">
    <div class="bg-divider mx-auto mb-3 h-1 w-10 rounded-full" />

    <button type="button" class="text-gray absolute top-0 right-0" @click="emit('close')">
      <X class="size-5" />
    </button>

    <div class="flex items-center gap-3">
      <div class="bg-accent flex size-10 shrink-0 items-center justify-center rounded-full">
        <component :is="categoryIcon[merchant.category]" class="text-primary size-5" />
      </div>
      <div class="min-w-0">
        <div class="flex items-center gap-2">
          <span class="text-subheading text-charcoal truncate">{{ merchant.name }}</span>
          <span
            class="text-label shrink-0 rounded-full px-2 py-0.5"
            :class="merchant.isOpen ? 'bg-success/10 text-success' : 'bg-disabled/40 text-gray'"
          >
            {{ merchant.isOpen ? '영업중' : '영업 종료' }}
          </span>
        </div>
        <p class="text-caption text-gray">
          {{ merchant.category }} · 현 위치에서 약 {{ formatDistance(merchant.distance) }}
        </p>
      </div>
    </div>

    <template v-if="cardRecommendation">
      <p class="text-caption text-primary mt-4 flex items-center gap-1">
        <Star class="size-3.5" />
        MOCA 추천 카드
      </p>

      <div class="bg-accent mt-2 space-y-2 rounded-md p-3">
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
      </div>
    </template>

    <p v-else class="text-caption text-gray mt-4">이 가맹점에서 받을 수 있는 혜택이 아직 없어요.</p>

    <div v-if="myCardRanking.length" class="mt-4">
      <p class="text-body text-charcoal">내 카드 혜택 순위</p>

      <div class="mt-2 space-y-3">
        <div
          v-for="(item, index) in myCardRanking"
          :key="item.rank"
          class="flex items-center gap-3"
        >
          <div class="flex shrink-0 items-center gap-1">
            <span class="text-caption text-primary w-6 shrink-0 font-bold">#{{ item.rank }}</span>

            <div
              class="h-9 w-6 shrink-0 rounded-md"
              :class="rankCardVisualClass[index % rankCardVisualClass.length]"
            />
          </div>

          <div class="min-w-0 flex-1">
            <p class="text-caption text-charcoal truncate">{{ item.cardName }}</p>
            <div class="bg-divider mt-1 h-1 overflow-hidden rounded-full">
              <div
                class="bg-primary h-full rounded-full"
                :style="{
                  width:
                    achievementPercent(
                      item.performanceCurrentAmount,
                      item.performanceRequiredAmount,
                    ) + '%',
                }"
              />
            </div>
          </div>

          <div class="flex w-14 shrink-0 justify-center">
            <span
              v-if="!item.performanceMet"
              class="text-label bg-accent text-primary rounded-full px-2 py-0.5 whitespace-nowrap"
            >
              미충족
            </span>
            <span v-else class="text-caption text-charcoal whitespace-nowrap">
              {{ item.benefitLabel }}
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
