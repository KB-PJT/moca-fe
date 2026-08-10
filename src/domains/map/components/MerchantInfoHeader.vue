<script setup lang="ts">
import { formatDistance } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'

interface Props {
  merchant: Merchant
}

defineProps<Props>()
</script>

<template>
  <div class="flex items-center gap-3">
    <div class="bg-accent flex size-10 shrink-0 items-center justify-center rounded-full">
      <component
        :is="categoryIcon[merchant.category] ?? DEFAULT_CATEGORY_ICON"
        class="text-primary size-5"
      />
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
</template>
