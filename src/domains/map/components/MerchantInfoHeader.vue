<script setup lang="ts">
import { Coffee, ShoppingBag, ShoppingCart, Utensils, X } from '@lucide/vue'
import { formatDistance } from '@/shared/utils/format'
import type { Merchant } from '@/domains/map/api/merchants.mock'

interface Props {
  merchant: Merchant
}

defineProps<Props>()
const emit = defineEmits<{ close: [] }>()

const categoryIcon: Record<Merchant['category'], typeof Utensils> = {
  음식점: Utensils,
  카페: Coffee,
  편의점: ShoppingBag,
  마트: ShoppingCart,
}
</script>

<template>
  <div class="relative">
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
  </div>
</template>
