<script setup lang="ts">
import { computed } from 'vue'
import type { BenefitCategoryItem } from '@/domains/benefit-report/api/benefitReport'
import { categoryIcon, DEFAULT_CATEGORY_ICON } from '@/domains/map/utils/categoryIcon'
import { formatAmountWithUnit } from '@/shared/utils/format'

const props = defineProps<{
  items: BenefitCategoryItem[]
}>()

const RANK_MEDAL: Record<number, string> = {
  1: '🥇',
  2: '🥈',
  3: '🥉',
}

function iconFor(categoryName: string) {
  return categoryIcon[categoryName] ?? DEFAULT_CATEGORY_ICON
}

const first = computed(() => props.items.find((item) => item.rank === 1))
// 2위/3위 자리는 항상 2칸을 채운다. 데이터가 없는 순위는 빈 카드로 보여줘서
// 카테고리가 2개뿐일 때 그리드에 빈 칸이 남는 문제를 없앤다.
const second = computed(() => props.items.find((item) => item.rank === 2))
const third = computed(() => props.items.find((item) => item.rank === 3))
</script>

<template>
  <div>
    <p class="text-subheading font-bold text-charcoal">카테고리별 TOP3</p>

    <div
      v-if="first"
      class="mt-3 flex items-center gap-3 rounded-lg border border-primary/30 bg-card p-4"
    >
      <span
        class="flex size-11 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
      >
        <component :is="iconFor(first.categoryName)" class="size-5" />
      </span>

      <div class="min-w-0 flex-1">
        <div class="flex items-center gap-1">
          <span class="text-body font-bold text-charcoal">{{ first.categoryName }}</span>
          <span class="text-caption font-bold text-primary">{{ RANK_MEDAL[1] }} 1위</span>
        </div>
        <p class="mt-0.5 truncate text-caption text-gray">이번 달 가장 많이 절약한 카테고리</p>
      </div>

      <span class="shrink-0 text-body font-bold text-charcoal">
        {{ formatAmountWithUnit(first.benefitAmount).replace('원', '')
        }}<span class="text-caption font-normal text-gray">원</span>
      </span>
    </div>

    <div class="mt-2 grid grid-cols-2 gap-2">
      <div
        v-for="(item, index) in [second, third]"
        :key="index"
        class="rounded-lg border border-divider bg-card p-3.5"
      >
        <template v-if="item">
          <div class="flex items-center gap-1.5">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-primary"
            >
              <component :is="iconFor(item.categoryName)" class="size-3.5" />
            </span>
            <span class="truncate text-caption font-semibold text-charcoal">{{
              item.categoryName
            }}</span>
            <span class="shrink-0 text-label">{{ RANK_MEDAL[item.rank] }}</span>
            <span class="ml-auto shrink-0 text-caption font-bold text-charcoal">
              {{ formatAmountWithUnit(item.benefitAmount).replace('원', '')
              }}<span class="text-label font-normal text-gray">원</span>
            </span>
          </div>
        </template>
        <template v-else>
          <div class="flex items-center gap-1.5">
            <span
              class="flex size-7 shrink-0 items-center justify-center rounded-full bg-divider text-gray"
            >
              <component :is="DEFAULT_CATEGORY_ICON" class="size-3.5" />
            </span>
            <span class="truncate text-caption font-semibold text-gray">아직 없음</span>
            <span class="ml-auto shrink-0 text-label opacity-40">{{
              RANK_MEDAL[index === 0 ? 2 : 3]
            }}</span>
          </div>
        </template>
      </div>
    </div>

    <p v-if="items.length === 0" class="mt-3 text-caption text-gray">
      이번 달 카테고리별 혜택 내역이 없어요.
    </p>
  </div>
</template>
