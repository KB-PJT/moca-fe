<script setup lang="ts">
import { computed } from 'vue'
import { formatDistance } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'
import { brandMark } from '@/domains/map/composables/markerIcon'

interface Props {
  merchant: Merchant
}

const props = defineProps<Props>()

// 지도 마커랑 같은 브랜드 로고 데이터를 재사용한다. 브랜드가 매칭되면 실제 로고를,
// 아니면 기존처럼 카테고리 아이콘을 보여준다.
const brand = computed(() =>
  props.merchant.brandName ? brandMark[props.merchant.brandName] : undefined,
)
</script>

<template>
  <div class="flex items-center gap-3">
    <div
      class="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
      :class="brand ? 'bg-white' : 'bg-accent'"
      :style="brand ? { border: `2px solid ${brand.outlineColor ?? brand.fill}` } : undefined"
    >
      <img
        v-if="brand"
        :src="brand.logoUrl"
        :alt="`${merchant.category} 로고`"
        class="size-6 object-contain"
      />
      <component
        v-else
        :is="categoryIcon[merchant.category] ?? DEFAULT_CATEGORY_ICON"
        class="text-primary size-5"
      />
    </div>
    <div class="min-w-0">
      <span class="text-subheading text-charcoal truncate">{{ merchant.name }}</span>
      <p class="text-caption text-gray">
        {{ merchant.category }} · 현 위치에서 약 {{ formatDistance(merchant.distance) }}
      </p>
      <p v-if="merchant.address" class="text-caption text-gray truncate">
        {{ merchant.address }}
      </p>
    </div>
  </div>
</template>
