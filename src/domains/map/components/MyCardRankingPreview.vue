<script setup lang="ts">
import { computed } from 'vue'
import type { Merchant } from '@/domains/map/api/merchants'
import { myCardRankingByPlaceId, type MyCardRankItem } from '@/domains/map/api/myCardRanking.mock'
import { formatAmountWithUnit } from '@/shared/utils/format'
import CardImage from '@/shared/components/CardImage.vue'

interface Props {
  merchant: Merchant
  // 상세 페이지 전용: 발급사, 미충족 카드 약관 박스까지 보여준다.
  detailed?: boolean
  // 상세 페이지 계산기에서 입력한 결제 금액. 있으면 %대신 실제 혜택 금액을 보여준다.
  appliedAmount?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  detailed: false,
  appliedAmount: null,
})

const myCardRanking = computed(() => myCardRankingByPlaceId[props.merchant.placeId] ?? [])

function estimatedAmountFor(item: MyCardRankItem): number {
  if (props.appliedAmount === null) return 0
  return Math.floor(props.appliedAmount * (item.discountRate / 100))
}
</script>

<template>
  <div v-if="myCardRanking.length" class="mt-4">
    <p class="text-subheading text-charcoal">내 카드 혜택 순위</p>

    <div class="mt-2 space-y-3">
      <div v-for="item in myCardRanking" :key="item.rank">
        <div class="flex items-center gap-3">
          <div class="flex shrink-0 items-center gap-1">
            <span class="text-caption text-primary w-6 shrink-0 font-bold">#{{ item.rank }}</span>
            <CardImage
              :src="item.imageUrl"
              :alt="`${item.cardName} 카드 이미지`"
              :width="24"
              :height="38"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <p class="text-caption text-charcoal truncate leading-none">{{ item.cardName }}</p>
            <p v-if="detailed" class="text-label text-gray truncate">{{ item.issuer }}</p>
            <div class="bg-divider mt-1.5 h-1 rounded-full">
              <div
                class="bg-primary h-full rounded-full"
                :style="{ width: `${item.performanceRate}%` }"
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
              {{
                appliedAmount !== null
                  ? formatAmountWithUnit(estimatedAmountFor(item))
                  : item.benefitLabel
              }}
            </span>
          </div>
        </div>

        <!-- 미충족 카드 밑에 왜 미충족인지 바로 알 수 있게 이 카드의 적용 조건을 눈에 띄는 회색 박스로 붙인다. 상세 페이지에서만 노출. -->
        <p
          v-if="detailed && !item.performanceMet && item.terms"
          class="text-label text-gray bg-screen mt-3 rounded-md p-3"
        >
          {{ item.terms }}
        </p>
      </div>
    </div>
  </div>
</template>
