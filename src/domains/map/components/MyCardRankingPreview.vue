<script setup lang="ts">
import { ref } from 'vue'
import { ChevronDown } from '@lucide/vue'
import type { RankedCardBenefit } from '@/domains/map/api/merchants'
import { describeRecommendationReason, formatRewardLabel } from '@/domains/map/utils/rewardFormat'
import { formatAmountWithUnit } from '@/shared/utils/format'
import { gaugeFillPercent } from '@/domains/map/utils/tierGauge'
import CardImage from '@/shared/components/CardImage.vue'

interface Props {
  rankedCards: RankedCardBenefit[]
  // 상세 페이지 전용: 발급사, 미충족 카드 사유 박스까지 보여준다.
  detailed?: boolean
  // 상세 페이지 계산기에서 입력한 결제 금액. 있으면 %/포인트 대신 그 금액 기준 실제 혜택 금액을 보여준다.
  appliedAmount?: number | null
}

const props = withDefaults(defineProps<Props>(), {
  detailed: false,
  appliedAmount: null,
})

// 미충족 카드 밑에 왜 미충족인지 보여줄 미충족 사유 전부(최소 결제금액, 전월 실적 등
// 여러 조건이 동시에 미충족일 수 있어 첫 번째만 보여주면 나머지가 가려진다).
function unmetReasonTexts(item: RankedCardBenefit): string[] {
  return item.recommendationReasons
    .filter((candidate) => !candidate.satisfied)
    .map(describeRecommendationReason)
}

// 미충족 사유 박스는 상세 페이지에서 항상 보이지 않고, 카드를 눌러야 펼쳐지게 한다.
function isExpandable(item: RankedCardBenefit): boolean {
  return Boolean(props.detailed && !item.performanceMet && unmetReasonTexts(item).length)
}

const expandedCardIds = ref(new Set<string>())

function toggleReason(userCardId: string) {
  const next = new Set(expandedCardIds.value)
  if (next.has(userCardId)) {
    next.delete(userCardId)
  } else {
    next.add(userCardId)
  }
  expandedCardIds.value = next
}
</script>

<template>
  <div v-if="rankedCards.length" class="mt-6">
    <p class="text-subheading text-charcoal">내 카드 혜택 순위</p>

    <div class="mt-3 space-y-3">
      <div v-for="item in rankedCards" :key="item.userCardId">
        <component
          :is="isExpandable(item) ? 'button' : 'div'"
          type="button"
          class="flex w-full items-center gap-3 text-left"
          @click="isExpandable(item) && toggleReason(item.userCardId)"
        >
          <div class="flex shrink-0 items-center gap-1">
            <span class="text-caption text-primary w-6 shrink-0 font-bold">#{{ item.rank }}</span>
            <CardImage
              :src="item.cardImageUrl"
              :alt="`${item.cardName} 카드 이미지`"
              :width="24"
              :height="38"
            />
          </div>

          <div class="flex min-w-0 flex-1 flex-col justify-center">
            <p class="text-caption text-charcoal truncate leading-none">{{ item.cardName }}</p>
            <p v-if="detailed && item.issuerName" class="text-caption text-gray truncate">
              {{ item.issuerName }}
            </p>
            <div
              class="bg-divider mt-1.5 h-1 rounded-full"
              role="progressbar"
              :aria-label="`${item.cardName} 실적 달성률`"
              aria-valuemin="0"
              aria-valuemax="100"
              :aria-valuenow="gaugeFillPercent(item)"
            >
              <div
                class="bg-primary h-full rounded-full"
                :style="{ width: `${gaugeFillPercent(item)}%` }"
              />
            </div>
          </div>

          <div class="flex min-h-9 min-w-14 shrink-0 flex-col items-end justify-center gap-0.5">
            <span
              v-if="!item.performanceMet"
              class="text-caption bg-accent text-primary flex items-center gap-0.5 rounded-full px-1.5 py-0.5 whitespace-nowrap transition-[border-color]"
              :class="
                isExpandable(item) && expandedCardIds.has(item.userCardId)
                  ? 'border border-charcoal'
                  : 'border border-transparent'
              "
            >
              미충족
              <ChevronDown
                v-if="isExpandable(item)"
                class="size-2.5 shrink-0 transition-transform"
                :class="expandedCardIds.has(item.userCardId) && 'rotate-180'"
              />
            </span>
            <span v-else class="text-caption text-charcoal whitespace-nowrap">
              {{
                appliedAmount !== null
                  ? formatAmountWithUnit(item.estimatedValueKrw)
                  : formatRewardLabel(item)
              }}
            </span>
            <!-- 미충족 카드도 조건만 채우면 받을 수 있는 혜택이 뭔지 바로 보여줘 판단에 도움을 준다.
                 계산기로 결제 금액을 입력한 상태면, 요율 대신 그 금액 기준 실제 혜택 금액을 보여준다. -->
            <span v-if="!item.performanceMet" class="text-caption text-gray whitespace-nowrap">
              {{
                appliedAmount !== null
                  ? formatAmountWithUnit(item.estimatedValueKrw)
                  : formatRewardLabel(item)
              }}
            </span>
          </div>
        </component>

        <!-- 미충족 카드를 누르면 왜 미충족인지 사유를 눈에 띄는 회색 박스로 펼쳐 보여준다. 상세 페이지에서만 노출.
             배지 위로 살짝 내려오듯 펼쳐지게(opacity+translateY만 사용, 레이아웃 프로퍼티는 안 건드림). -->
        <Transition
          enter-active-class="transition-[opacity,transform] duration-200 ease-out motion-reduce:transition-none"
          enter-from-class="opacity-0 -translate-y-1"
          enter-to-class="opacity-100 translate-y-0"
          leave-active-class="transition-opacity duration-150 ease-out motion-reduce:transition-none"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <div
            v-if="isExpandable(item) && expandedCardIds.has(item.userCardId)"
            class="text-label text-gray bg-screen mt-3 w-9/10 mx-auto space-y-1 rounded-md p-3"
          >
            <p v-for="text in unmetReasonTexts(item)" :key="text">{{ text }}</p>
          </div>
        </Transition>
      </div>
    </div>
  </div>
</template>
