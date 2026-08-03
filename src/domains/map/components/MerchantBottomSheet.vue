<script setup lang="ts">
import { computed } from 'vue'
import { ChevronRight, Coffee, ShoppingBag, ShoppingCart, Star, Utensils, X } from '@lucide/vue'
import MocaButton from '@/shared/components/MocaButton.vue'
import {
  formatAchievementRate,
  formatAmountWithUnit,
  formatDistance,
  formatPercent,
} from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants.mock'
import { cardRecommendationByPlaceId } from '@/domains/map/api/cardRecommendation.mock'

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

const cardRecommendation = computed(
  () => cardRecommendationByPlaceId[props.merchant.placeId] ?? null,
)
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

    <div v-if="cardRecommendation" class="mt-4">
      <p class="text-body text-primary flex items-center gap-1">
        <Star class="size-4" />
        MOCA 추천 카드 {{ cardRecommendation.rank }}순위
      </p>

      <div class="bg-accent mt-2 space-y-3 rounded-md p-4">
        <div class="flex items-center gap-3">
          <div class="h-20 w-14 shrink-0 rounded-lg bg-linear-to-br from-teal-400 to-emerald-600" />

          <div class="min-w-0 flex-1">
            <p class="text-subheading text-charcoal line-clamp-2">
              {{ cardRecommendation.cardName }}
            </p>
            <p class="text-caption text-gray truncate">{{ cardRecommendation.reason }}</p>
          </div>

          <div class="shrink-0 text-right">
            <p class="text-heading text-primary whitespace-nowrap">
              {{ formatPercent(cardRecommendation.discountRate) }} 할인
            </p>
            <p class="text-caption text-gray whitespace-nowrap">
              최소결제금액 {{ formatAmountWithUnit(cardRecommendation.minPaymentAmount) }}
            </p>
          </div>
        </div>

        <div>
          <div class="flex items-center justify-between">
            <span class="text-caption text-gray">
              {{ formatAmountWithUnit(cardRecommendation.performanceCurrentAmount) }} /
              {{ formatAmountWithUnit(cardRecommendation.performanceRequiredAmount) }}
            </span>
            <span class="text-caption text-primary shrink-0">
              {{
                formatAchievementRate(
                  cardRecommendation.performanceCurrentAmount,
                  cardRecommendation.performanceRequiredAmount,
                )
              }}
            </span>
          </div>
          <div class="bg-divider mt-1 h-1.5 overflow-hidden rounded-full">
            <div
              class="bg-primary h-full rounded-full"
              :style="{
                width:
                  Math.min(
                    100,
                    (cardRecommendation.performanceCurrentAmount /
                      cardRecommendation.performanceRequiredAmount) *
                      100,
                  ) + '%',
              }"
            />
          </div>
        </div>

        <MocaButton
          block
          class="bg-card text-primary hover:text-white flex items-center justify-center gap-1 shadow-none"
        >
          혜택 자세히 보기
          <ChevronRight class="size-4" />
        </MocaButton>
      </div>
    </div>

    <p v-if="!cardRecommendation" class="text-caption text-gray mt-4">
      이 가맹점에서 받을 수 있는 혜택이 아직 없어요.
    </p>
  </div>
</template>
