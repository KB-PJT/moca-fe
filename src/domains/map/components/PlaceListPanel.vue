<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowUpDown, Check } from '@lucide/vue'
import { onClickOutside } from '@vueuse/core'
import type { Merchant } from '@/domains/map/api/merchants'
import PlaceListRow from '@/domains/map/components/PlaceListRow.vue'

interface Props {
  merchants: Merchant[]
}

const props = defineProps<Props>()
const emit = defineEmits<{ select: [merchant: Merchant] }>()

type SortMode = 'benefit' | 'distance'

const sortOptions: { value: SortMode; label: string }[] = [
  { value: 'benefit', label: '예상 혜택순' },
  { value: 'distance', label: '거리순' },
]

const sortMode = ref<SortMode>('benefit')
const isSortMenuOpen = ref(false)
const sortMenuRef = ref<HTMLElement | null>(null)

onClickOutside(sortMenuRef, () => {
  isSortMenuOpen.value = false
})

const currentSortLabel = computed(
  () => sortOptions.find((option) => option.value === sortMode.value)?.label,
)

// 카드 구조가 추천 카드 정보를 전제로 하므로, 혜택이 있는 가맹점만 목록에 노출한다.
const benefitMerchants = computed(() => props.merchants.filter((merchant) => merchant.bestBenefit))

const sortedMerchants = computed(() => {
  const list = [...benefitMerchants.value]

  if (sortMode.value === 'distance') {
    return list.sort((a, b) => a.distance - b.distance)
  }

  return list.sort((a, b) => b.bestBenefit!.estimatedBenefit - a.bestBenefit!.estimatedBenefit)
})

function selectSort(mode: SortMode) {
  sortMode.value = mode
  isSortMenuOpen.value = false
}
</script>

<template>
  <div class="flex h-full flex-col">
    <div class="flex items-center justify-between px-4 pt-1 pb-2">
      <p class="text-caption text-gray">혜택 가맹점 {{ sortedMerchants.length }}곳</p>

      <div ref="sortMenuRef" class="relative">
        <button
          type="button"
          class="text-caption text-gray flex items-center gap-1"
          @click="isSortMenuOpen = !isSortMenuOpen"
        >
          <ArrowUpDown class="size-3.5" />
          {{ currentSortLabel }}
        </button>

        <div
          v-if="isSortMenuOpen"
          class="bg-card shadow-float absolute top-full right-0 z-10 mt-1 w-32 overflow-hidden rounded-md"
        >
          <button
            v-for="option in sortOptions"
            :key="option.value"
            type="button"
            class="text-caption text-charcoal flex w-full items-center justify-between px-3 py-2"
            @click="selectSort(option.value)"
          >
            {{ option.label }}
            <Check v-if="sortMode === option.value" class="text-primary size-4" />
          </button>
        </div>
      </div>
    </div>

    <div
      v-if="sortedMerchants.length"
      class="scrollbar-hide min-h-0 flex-1 space-y-3 overflow-y-auto px-4 pb-4"
    >
      <PlaceListRow
        v-for="merchant in sortedMerchants"
        :key="merchant.placeId"
        :merchant="merchant"
        @click="emit('select', merchant)"
      />
    </div>

    <p v-else class="text-caption text-gray flex-1 pt-10 text-center">
      이 카테고리에는 혜택 가맹점이 없어요.
    </p>
  </div>
</template>
