<script setup lang="ts">
import { computed } from 'vue'
import type { Merchant } from '@/domains/map/api/merchants.mock'
import { myCardRankingByPlaceId } from '@/domains/map/api/myCardRanking.mock'

interface Props {
  merchant: Merchant
}

const props = defineProps<Props>()

// 랭킹 순서대로 카드 비주얼 색을 다르게 준다 (실제 카드 디자인 데이터는 없음).
const rankCardVisualClass = ['bg-brown', 'bg-brown-light', 'bg-charcoal']

const myCardRanking = computed(() => myCardRankingByPlaceId[props.merchant.placeId] ?? [])
</script>

<template>
  <div v-if="myCardRanking.length" class="mt-4">
    <p class="text-subheading text-charcoal">내 카드 혜택 순위</p>

    <div class="mt-2 space-y-3">
      <div v-for="(item, index) in myCardRanking" :key="item.rank" class="flex items-center gap-3">
        <div class="flex shrink-0 items-center gap-1">
          <span class="text-caption text-primary w-6 shrink-0 font-bold">#{{ item.rank }}</span>
          <div
            class="h-9 w-6 shrink-0 rounded-md"
            :class="rankCardVisualClass[index % rankCardVisualClass.length]"
          />
        </div>

        <div class="min-w-0 flex-1">
          <p class="text-caption text-charcoal truncate">{{ item.cardName }}</p>
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
</template>
