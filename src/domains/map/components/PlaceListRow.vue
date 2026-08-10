<script setup lang="ts">
import { formatAmountWithUnit, formatDistance } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'

interface Props {
  merchant: Merchant
}

defineProps<Props>()
const emit = defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="bg-accent block w-full rounded-2xl p-4 text-left"
    @click="emit('click')"
  >
    <div class="flex items-center gap-3">
      <div class="bg-card flex size-10 shrink-0 items-center justify-center rounded-xl">
        <component
          :is="categoryIcon[merchant.category] ?? DEFAULT_CATEGORY_ICON"
          class="text-primary size-5"
        />
      </div>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-2">
          <span class="text-body text-charcoal truncate font-semibold">{{ merchant.name }}</span>
          <span
            class="text-label shrink-0 rounded-full px-2 py-0.5"
            :class="merchant.isOpen ? 'bg-success/10 text-success' : 'bg-disabled/40 text-gray'"
          >
            {{ merchant.isOpen ? '영업중' : '영업 종료' }}
          </span>
        </div>
        <p class="text-caption text-gray truncate">
          {{ merchant.category }} · {{ formatDistance(merchant.distance) }}
        </p>
      </div>

      <div v-if="merchant.bestBenefit" class="shrink-0 text-right">
        <p class="text-subheading text-primary whitespace-nowrap">
          {{ merchant.bestBenefit.benefitLabel }}
        </p>
        <p class="text-label text-gray whitespace-nowrap">예상 혜택</p>
      </div>
    </div>

    <!-- 이 가맹점에서 가장 유리한 추천 카드. 기준 결제 금액을 함께 보여줘 예상 혜택 금액의 근거를 알 수 있게 한다. -->
    <div
      v-if="merchant.bestBenefit"
      class="border-divider mt-3 flex items-center gap-2 border-t pt-3"
    >
      <div class="bg-brown h-4 w-4 shrink-0 rounded-sm" />
      <p class="text-label text-gray shrink-0">추천 카드</p>
      <p class="text-caption text-charcoal min-w-0 flex-1 truncate font-semibold">
        {{ merchant.bestBenefit.cardName }}
      </p>
      <p class="text-label text-gray shrink-0 whitespace-nowrap">
        {{ formatAmountWithUnit(merchant.bestBenefit.baselineAmount) }} 기준
      </p>
    </div>
  </button>
</template>
